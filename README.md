# Squirrel Commando

A third-person 3D shooter built with three.js, in a single `index.html`.

Play as a squirrel, panda, German Shepherd, Jack Russell or bear across five maps:
Sunny Meadow, Frosty Pines, Canyon Dunes, Spooky Hollow and Blossom Garden.

## Modes

- **Solo:** defend the nut stash at the centre of the map from waves of garden gnomes, diving crows and the Gnome King.
- **Versus (couch):** split screen on one computer or TV, with each player's phone used as a controller via QR code. Phones connect straight to the TV over your Wi-Fi.
- **Versus (online):** two computers, joined with a link or QR code, through the game server.

## Weapons and power-ups

Acorn Blaster, Nutshot (shotgun), Pinecone Launcher and Seed Spitter (minigun) come from supply crates.
Power-ups: Rapid Fire, Double Damage, Shield and Turbo Paws.

## Controls

| Action | Keys |
|---|---|
| Move | WASD |
| Aim / shoot | Mouse / click (hold for auto) |
| Jump (double jump) | Space |
| Sprint | Shift |
| Reload | R |
| Switch weapon | 1–4, Q or scroll wheel |
| Change camera | Right click or V |
| Pause | Esc |

## Running it

```
npm install
npm start
```

Then open http://localhost:6868. `server.js` serves the game and runs its
multiplayer rooms (Node, Express and socket.io).

- **Couch versus:** open the game on the computer connected to the TV and pick
  Versus > Couch. Each player scans their QR code. When the game is opened on
  localhost, the codes use the computer's Wi-Fi address so phones can reach it.
  Each phone then opens a direct WebRTC link to the TV over your own Wi-Fi, so
  the controls don't make a round trip to a server; the phone shows
  "⚡ Direct to the TV". If that link can't open, the controls go through the
  server instead.
- **Online versus:** Versus > Online gives a link (and QR code) for the other
  player. Online matches run through the server, so for play over the internet
  host it somewhere public, such as Render.
- **Solo** needs no server; opening `index.html` directly still works.

The game still runs as a Claude Artifact too: there, Versus uses the Artifact's
real-time `room` capability instead of `server.js`.

## Hosting on Render

`render.yaml` describes the service. In the Render dashboard choose
New > Blueprint and pick this repository; Render installs it, runs
`node server.js`, and redeploys on every push to `main`. Anyone can then open
the game at its onrender.com address and play couch or online versus.
