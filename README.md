# Squirrel Commando

A third-person 3D shooter built with three.js, in a single `index.html`.

Play as a squirrel, panda, German Shepherd, Jack Russell or bear across five maps:
Sunny Meadow, Frosty Pines, Canyon Dunes, Spooky Hollow and Blossom Garden.

## Modes

- **Solo:** defend the nut stash at the centre of the map from 100 waves of garden gnomes, diving crows, tunnelling moles and a boss every fifth wave. Clear wave 100 to win. After each wave, pick one of three upgrades for the rest of the run (more health, speed, damage, faster reloads, stash walls, longer power-ups, healing on kills, an extra air jump, bonus points). Solo setup also has **Phone controller**: play on the TV and steer with your phone (scan the code). Drag your fighter on Solo setup to turn it around.
- **Versus (couch):** 2 to 4 players split screen on one computer or TV, with each player's phone used as a controller via QR code. Phones connect straight to the TV over your Wi-Fi. Three or four players is a free-for-all: first to 7 bonks.
- **Versus (online):** two computers, joined with a link or QR code, through the game server.
- **Co-op (couch):** 2 to 4 players on one TV, each with a phone controller, defend the stash together. Waves grow with the team; a downed player stays where they fell: stand next to them for a couple of seconds to revive them, or they are back at the stash after 12 seconds. With three players the spare quarter of the screen shows a map.
- **Bots:** on the couch, any empty spot can be a bot (Add a bot on its panel at fighter select; the Bots button sets Easy, Normal or Hard). One person with a phone or controller can practise versus against bots, or play co-op with a bot teammate. Only people get a slice of the screen.
- **Co-op (online):** two computers defend one stash; the host runs the waves.

## Awards and rumble

At the end of a versus or co-op match the TV hands out awards (Bonk Machine, Sharpshooter, Heavy Hitter, Medic,
Untouchable, Hoarder) to whoever leads each one outright, and each phone shows the ones its player won. Phones
buzz when you get hit, bonk someone or go down; controllers that support it rumble too.

## Bosses

A boss comes every 5 waves, in turn: the Gnome King (ground slam), the Crow Queen (calls her flock, then dives),
the Mole Overlord (tunnels to you and bursts out of the ground, throws rocks), the Gnome Wizard (teleports, throws
homing magic) and the Mecha-Gnome (mortar shells that land in red rings). Each time round they come back tougher:
Mighty, then Dread, then Legendary, with more health, faster attacks, fury at half health and escorts. Wave 100 is
the Gnome Emperor, who uses everything at once.

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

Game controllers (Xbox, PlayStation, Switch Pro and others the browser supports) work too:
left stick moves, right stick aims, RT fires, A jumps, X reloads, LB/RB switch weapons,
Y changes the camera, B or L3 sprints, Start pauses; on menus the d-pad moves and A presses.
On the couch a controller takes a player spot of its own instead of a phone: press A in the
lobby or at fighter select (B leaves the spot, Y changes the map).

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
- **Co-op:** Co-op > Couch shows four codes; the match starts once at least two
  phones are in and everyone in is Ready. Co-op > Online works like online versus.
- **Solo** needs no server; opening `index.html` directly still works.

The game still runs as a Claude Artifact too: there, Versus uses the Artifact's
real-time `room` capability instead of `server.js`.

## Hosting on Render

`render.yaml` describes the service. In the Render dashboard choose
New > Blueprint and pick this repository; Render installs it, runs
`node server.js`, and redeploys on every push to `main`. Anyone can then open
the game at its onrender.com address and play couch or online versus.
