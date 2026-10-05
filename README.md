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

## Hats

Solo setup has ten hats to unlock on this device: Acorn Cap (from the start), Party Hat (finish a game), Propeller
Cap (reach wave 10), Viking Helmet (beat a boss), Pirate Hat (play 3 versus matches), Top Hat (score 25,000 in
solo), Wizard Hat (beat the Gnome Wizard), Chef Hat (bonk 1,000 enemies), Halo (revive teammates 10 times) and
the Golden Crown (beat all 100 waves). Your hat shows in solo and on your fighter in online matches.

## Daily challenge

Solo setup offers a daily challenge: the same map and two twists for everyone that day (low gravity, a glass
stash worth more points, crow day, mole rush, big heads, turbo gnomes, golden rain or Acorn Blaster only), with
your best score for the day kept on this device.

## Bosses

A different boss comes every 5 waves, nineteen in all, and then the Gnome Emperor on wave 100:

| Wave | Boss | How it fights |
|---|---|---|
| 5 | Gnome King | Ground slam: jump it |
| 10 | Crow Queen | Calls her flock, then dives |
| 15 | Mole Overlord | Tunnels to you, bursts out of the ground, throws rocks |
| 20 | Gnome Wizard | Teleports and throws homing magic |
| 25 | Mecha-Gnome | Mortar shells that land in red rings |
| 30 | Gnome Knight | Lowers his lance and charges in a straight line |
| 35 | Storm Crow | Throws lightning while circling, calls crows |
| 40 | Spore Lord | Rings of spores in every direction |
| 45 | Gnome Bomber | Runs away and lobs bombs |
| 50 | Frost Wizard | Wide fans of big ice orbs, teleports |
| 55 | Stone Golem | Every stomp sends a shockwave rolling out: jump the ring |
| 60 | Raven Lord | Drops bombs from the sky, calls his flock |
| 65 | Pirate Captain | Cannon fires three balls at once, plus mortars |
| 70 | Mole Queen | Tunnels to you; her diggers follow every time she surfaces |
| 75 | Shadow Gnome | Vanishes and reappears right beside you |
| 80 | Gnome Giant | Huge stomps, shockwaves and a crowd of gnomes |
| 85 | Phoenix | Fireballs from above and fast dives |
| 90 | Gnome Archmage | Magic orbs and a rain of meteors |
| 95 | Gnome General | Brings an army, mortars and cannon fire |
| 100 | Gnome Emperor | Slams, magic, mortars and an army, all at once |

Later bosses have more health. From wave 30 they get furious at half health (faster, attacking more
often), and from wave 55 they also call gnome bodyguards.

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
