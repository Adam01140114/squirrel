/**
 * SQUIRREL COMMANDO - GAME SERVER
 * ===============================
 *
 * Serves the game and runs its multiplayer rooms.
 *
 * The game speaks one small "room" interface (index.html, useRoom): join a room,
 * publish your presence (a small object about you, merged on each update), and
 * read everyone else's. This server keeps those rooms:
 *
 * - Online versus: the two computers' presences go through this server.
 * - Couch versus: the TV and the phones are in the same room too, but each phone
 *   also opens a WebRTC link straight to the TV over their Wi-Fi; this server
 *   only passes the set-up messages ("room:signal"). If that link can't open,
 *   the phone's input keeps coming through here.
 *
 * Run: npm start  (PORT, default 6868, for this computer and its Wi-Fi).
 *
 * The public link: a second entrance on 127.0.0.1:PUBLIC_PORT (default 6869), which
 * Tailscale Funnel passes https://<this Mac>.ts.net:8443 to. Everything there, the
 * game's own connection included, needs the code (PUBLIC_CODE, default 6767) once;
 * after that a cookie remembers it.
 */

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 6868;
const MAX_PEERS = 8;            // per room: a TV, two phones, and some slack for reconnects
const MAX_PRESENCE = 16 * 1024; // bytes of JSON per presence update
const NAME_RE = /^[a-z0-9-]{1,40}$/;
const PUBLIC_PORT = +process.env.PUBLIC_PORT || 6869;
const PUBLIC_CODE = process.env.PUBLIC_CODE || '6767';
const COOKIE = 'sc_code';
// The cookie's value: changes if the code does, and can't be made up without the code
const SECRET = crypto.createHash('sha256').update(__dirname + os.hostname()).digest('hex');
const pass = crypto.createHmac('sha256', SECRET).update('code:' + PUBLIC_CODE).digest('hex');

const app = express();
const server = http.createServer(app);
const publicServer = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 64 * 1024,
    allowRequest: (req, cb) => cb(null, !viaPublic(req) || hasPass(req)), // the code first, on the public link
});
io.attach(publicServer);

function viaPublic(req) { return req.socket.localPort === PUBLIC_PORT; }
function hasPass(req) {
    const m = /(?:^|;\s*)sc_code=([a-f0-9]{64})/.exec(req.headers.cookie || '');
    return !!m && crypto.timingSafeEqual(Buffer.from(m[1]), Buffer.from(pass));
}
const misses = { count: 0, since: 0 };
const CODE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Squirrel Commando</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1d2b1a;color:#fbf0cf;font:16px system-ui,sans-serif}
form{display:grid;gap:12px;padding:24px;width:min(300px,calc(100vw - 32px));background:rgba(0,0,0,.3);border-radius:14px;text-align:center}
h1{margin:0;font-size:22px}*{box-sizing:border-box}input,button{font:inherit;padding:12px;border-radius:10px;border:0;width:100%;min-width:0;margin:0}input{text-align:center;font-size:22px;letter-spacing:.2em}
button{background:#e0a81c;color:#1d2b1a;font-weight:700}p{margin:0;color:#ff8a7a;min-height:1.2em}</style></head>
<body><form method="post" action="/code"><h1>Squirrel Commando</h1><input name="code" inputmode="numeric" autocomplete="off" placeholder="Code" autofocus>
<button>Play</button><p>%MSG%</p></form></body></html>`;
// The public entrance's door: the code form, until the code's been given
app.use((req, res, next) => {
    if (!viaPublic(req) || req.path === '/health') return next();
    if (req.method === 'POST' && req.path === '/code') {
        let body = '';
        req.on('data', (c) => { if (body.length < 1000) body += c; });
        req.on('end', () => {
            if (misses.count >= 10 && Date.now() - misses.since < 10 * 60_000) {
                return res.status(429).type('html').send(CODE_PAGE.replace('%MSG%', 'Too many tries. Wait a few minutes.'));
            }
            const code = new URLSearchParams(body).get('code') || '';
            const ok = code.length === PUBLIC_CODE.length && crypto.timingSafeEqual(Buffer.from(code), Buffer.from(PUBLIC_CODE));
            if (!ok) {
                if (Date.now() - misses.since > 10 * 60_000) Object.assign(misses, { count: 0, since: Date.now() });
                misses.count++;
                return res.status(403).type('html').send(CODE_PAGE.replace('%MSG%', 'That code isn\'t right.'));
            }
            res.setHeader('Set-Cookie', `${COOKIE}=${pass}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
            res.redirect(303, '/');
        });
        return;
    }
    if (hasPass(req)) return next();
    if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
        res.setHeader('Cache-Control', 'no-store');
        return res.type('html').send(CODE_PAGE.replace('%MSG%', ''));
    }
    res.status(403).send('Enter the code first.');
});

// The game is one page; serve it and nothing else from this folder
// (gzipped once and kept, about 110 KB instead of 390: the public link is much slower than Wi-Fi)
const page = path.join(__dirname, 'index.html');
let packed = null;
function pagePacked() {
    const mtime = fs.statSync(page).mtimeMs;
    if (!packed || packed.mtime !== mtime) {
        const html = fs.readFileSync(page);
        packed = { mtime, html, gz: zlib.gzipSync(html, { level: 9 }), etag: '"' + crypto.createHash('sha1').update(html).digest('hex').slice(0, 16) + '"' };
    }
    return packed;
}
app.get(['/', '/index.html'], (req, res) => {
    const p = pagePacked();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', p.etag);
    res.setHeader('Vary', 'Accept-Encoding');
    if (req.headers['if-none-match'] === p.etag) return res.status(304).end();
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { res.setHeader('Content-Encoding', 'gzip'); return res.send(p.gz); }
    res.send(p.html);
});

// Addresses a phone on the same Wi-Fi can reach this computer at, best first.
// The game uses these for its QR codes when it is opened on localhost.
function lanOrigins() {
    const rank = ip => ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
    const ips = [];
    for (const list of Object.values(os.networkInterfaces())) {
        for (const a of list || []) {
            const family = typeof a.family === 'string' ? a.family : `IPv${a.family}`;
            if (family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) ips.push(a.address);
        }
    }
    return ips.sort((a, b) => rank(a) - rank(b)).map(ip => `http://${ip}:${PORT}`);
}
app.get('/api/lan', (req, res) => res.json({ origins: lanOrigins() }));
app.get('/health', (req, res) => res.send('ok'));

/** room name -> Map(socket id -> { presence, q }) */
const rooms = new Map();

function roomOf(name) {
    if (!rooms.has(name)) rooms.set(name, new Map());
    return rooms.get(name);
}

function leave(socket, name) {
    const room = rooms.get(name);
    if (!room || !room.has(socket.id)) return;
    room.delete(socket.id);
    socket.leave('room:' + name);
    socket.to('room:' + name).emit('room:gone', { name, peer: socket.id });
    if (room.size === 0) rooms.delete(name);
}

io.on('connection', (socket) => {
    socket.data.rooms = new Set();

    // Join a room; the answer lists who is already there
    socket.on('room:join', (payload, ack) => {
        const name = String((payload && payload.name) || '');
        if (typeof ack !== 'function') return;
        if (!NAME_RE.test(name)) return ack({ err: 'bad_name' });
        const room = roomOf(name);
        if (!room.has(socket.id) && room.size >= MAX_PEERS) return ack({ err: 'full' });
        if (!room.has(socket.id)) room.set(socket.id, { presence: {}, q: 0 });
        socket.data.rooms.add(name);
        socket.join('room:' + name);
        const peers = [];
        for (const [id, p] of room) if (id !== socket.id) peers.push({ peer: id, presence: p.presence, q: p.q });
        ack({ self: socket.id, peers });
    });

    // My presence changed: keep it (for anyone who joins later) and pass it on
    socket.on('room:presence', (payload) => {
        const name = payload && payload.name;
        const room = name && rooms.get(name);
        const me = room && room.get(socket.id);
        if (!me || !payload.presence || typeof payload.presence !== 'object') return;
        if (JSON.stringify(payload.presence).length > MAX_PRESENCE) return;
        const q = +payload.q || 0;
        if (q <= me.q) return;
        me.presence = payload.presence;
        me.q = q;
        socket.to('room:' + name).emit('room:peer', { name, peer: socket.id, presence: me.presence, q });
    });

    // WebRTC set-up between two members of the same room (couch: phone <-> TV)
    socket.on('room:signal', (payload) => {
        const name = payload && payload.name;
        const room = name && rooms.get(name);
        if (!room || !room.has(socket.id) || !room.has(payload.to)) return;
        io.to(payload.to).emit('room:signal', { name, from: socket.id, data: payload.data });
    });

    socket.on('room:leave', (payload) => {
        const name = payload && payload.name;
        if (name) { leave(socket, name); socket.data.rooms.delete(name); }
    });

    socket.on('disconnect', () => {
        for (const name of socket.data.rooms) leave(socket, name);
    });
});

server.listen(PORT, () => console.log(`Squirrel Commando running on http://localhost:${PORT}`));
publicServer.listen(PUBLIC_PORT, '127.0.0.1', () => console.log(`Public entrance (Tailscale Funnel :8443): http://127.0.0.1:${PUBLIC_PORT}`));
