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
 * Run: npm start  (PORT, default 6868). Render: see render.yaml.
 */

const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 6868;
const MAX_PEERS = 8;            // per room: a TV, two phones, and some slack for reconnects
const MAX_PRESENCE = 16 * 1024; // bytes of JSON per presence update
const NAME_RE = /^[a-z0-9-]{1,40}$/;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 64 * 1024 });

// The game is one page; serve it and nothing else from this folder
const page = path.join(__dirname, 'index.html');
app.get(['/', '/index.html'], (req, res) => res.sendFile(page));

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
