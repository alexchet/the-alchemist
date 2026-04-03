# The Alchemist — CLAUDE.md

> **Maintenance rule:** After every code change, check whether this file needs to be updated to reflect the new state of the project. Keep it accurate.

## Project Overview

**The Alchemist** is a browser-based dungeon crawler built in pure vanilla JavaScript with HTML5 Canvas. It was forked from the open-source game **Heroine Dusk™**. The current owner has added a procedural dungeon generator and a fog-of-war minimap.

- **Technology:** Vanilla JS, HTML5 Canvas, Web Audio API, cookies for saves
- **Resolution:** 160×120 native, scales dynamically to window
- **Color palette:** DawnBringer 16-color
- **No build step** — load `release/index.html` directly in a browser
- **Zero external dependencies** — no frameworks, no npm, no bundler

---

## Directory Layout

```
the-alchemist/
├── release/                  # Deployable game (open this in browser)
│   ├── index.html            # Entry point — <body onload="init()">
│   ├── css/maze.css          # Canvas centering/styling
│   ├── js/                   # All 27 game modules
│   ├── images/               # PNG sprites (backgrounds, enemies, tiles, UI, treasure)
│   ├── sounds/               # 14 WAV sound effects
│   └── music/                # 4 tracks (.mp3 + .ogg each)
├── art_src/                  # Source art (GIMP .xcf, Blender .blend, BFXR .bfxrsound)
├── prescaled/                # Pre-rendered asset variants at 1×–8× scale
└── tutorial/                 # Draw-order reference images
```

---

## Script Load Order (index.html)

Order matters — each file relies on globals set by earlier ones:

```
config.js → loadbar.js → utils.js → input.js → bitfont.js → sounds.js
→ enemy.js → tileset.js → dungeongenerator.js → mazemap.js → avatar.js
→ action.js → power.js → treasure.js → combat.js → minimap.js → info.js
→ mapscript.js → explore.js → shop.js → dialog.js → boss.js → title.js
→ gamestate.js → main.js
```

---

## Architecture: Core Loop

**`main.js`** runs a `setInterval` at 60 FPS:
1. `logic()` → `gamestate_logic()` → state handler
2. `render()` → `gamestate_render()` → state renderer

Rendering is gated by a `redraw` flag — only redraws when something changed.

**`gamestate.js`** dispatches to one of 5 states:

| Constant | Value | Description |
|---|---|---|
| `STATE_EXPLORE` | 0 | Dungeon navigation |
| `STATE_COMBAT` | 1 | Turn-based combat |
| `STATE_INFO` | 2 | Character stats / inventory |
| `STATE_DIALOG` | 3 | Shop / NPC interaction |
| `STATE_TITLE` | 4 | Main menu |

---

## Module Reference

| File | Responsibility |
|---|---|
| `config.js` | Engine constants (`VIEW_WIDTH=160`, `VIEW_HEIGHT=120`, `PRESCALE`, `SCALE`, `OPTIONS`) |
| `utils.js` | Canvas scaling, cookie helpers (`setCookie`, `getCookie`) |
| `input.js` | Keyboard (arrows/WASD/Space/Enter), mouse, touch — `pressing` + `input_lock` objects |
| `bitfont.js` | Bitmap font renderer — white/red text, left/center/right justification |
| `sounds.js` | Web Audio `new Audio()` wrappers — 14 SFX constants + 4 music tracks |
| `enemy.js` | Enemy definitions (8 types + boss), rendering, category constants |
| `tileset.js` | 3D pseudo-perspective tile rendering — 19 tile types, 13 draw positions |
| `dungeongenerator.js` | **Procedural dungeon generation** (Hauberk/Bob Nystrom algorithm) |
| `mazemap.js` | Active map state, 13-tile visibility cone, exit/shop checking, tile rendering |
| `avatar.js` | Player data (position, HP/MP, equipment, gold, campaign flags), movement, save/load |
| `atlas.js` | Handcrafted map data — 11 maps as 2D tile arrays with exits, enemies, shops |
| `action.js` | Action button grid — layout, selection navigation, context-awareness |
| `power.js` | Combat ability resolution (attack, heal, burn, unlock, run, boss powers) |
| `treasure.js` | Loot rendering (gold icons, stat gems) and pickup logic |
| `combat.js` | 6-phase combat state machine (intro → input → offense → defense → victory → defeat) |
| `minimap.js` | **Minimap rendering + fog of war** — 1px/tile, 40×40 viewport, vision cone discovery |
| `info.js` | Character stats screen renderer |
| `mapscript.js` | Tile-triggered events (chests, bone piles, locked doors, forced encounters, messages) |
| `explore.js` | Exploration state — movement input, encounter chance, map transitions, shop entry |
| `shop.js` | Shop data (9 shops, weapons/armor/spells/messages) and transaction logic |
| `dialog.js` | Shop conversation UI — 2-item display, mouse/keyboard navigation |
| `boss.js` | Death Speaker boss AI (bone shield mechanic, post-defeat map alteration) |
| `title.js` | Main menu + options (animation, music, sfx, minimap — persisted to cookies) |
| `gamestate.js` | State machine — dispatches logic/render to the active state |
| `main.js` | `init()` entry point, 60 FPS game loop |
| `loadbar.js` | Asset preloading progress bar |

---

## Map System

### Handcrafted Maps (`atlas.js`)
11 maps with manually authored tile grids, exit definitions, enemy pools, shops, and music references. Map IDs 0–10 correspond to: Serf Quarters → Gar'ashi Monastery → Monk Quarters → Meditation Point → Monastery Trail → Cedar Village → Zuruth Plains → Canal Boneyard → Mausoleum → Dead Walkways → Trade Tunnel.

### Procedural Dungeon (`dungeongenerator.js`)
Adapted Hauberk algorithm (Bob Nystrom). Generates a 41×41 dungeon:
1. `add_rooms()` — 600 placement attempts, min 5×5 rooms
2. `grow_maze()` — growing-tree fills remaining space (`WINDING_PERCENT=50`)
3. `connect_regions()` — joins isolated regions with doors (`EXTRA_CONNECTOR_CHANCE=20`)
4. `limit_room_side_connections()` — max 1 door per room wall
5. `remove_dead_ends()` — iteratively prunes single-exit corridors
6. `find_connections()` — wires room exits back to corridor tiles

**Output:**
- `atlas.maps[0]` — corridor/maze grid
- `atlas.maps[1..N]` — individual room grids
- `atlas.minimap_grid` — merged full-dungeon view (for minimap)
- `atlas.rooms` — room metadata (position, size, connections)

**Tile constants:**
- `1` = FLOOR (walkable)
- `2` = WALL
- `3` = DOOR (exit)
- `5` = CEIL (room interior — renders as wall from corridor)

### Tileset Visibility Cone (13 draw positions)
```
Back row:  [0][1][2][3][4]
Mid row:   [5][6][7][8][9]
Front row:    [10][11][12]
```

---

## Minimap & Fog of War (`minimap.js`)

- Renders 1 pixel per tile into a 40×40 viewport centered on player
- Reads from `atlas.minimap_grid`
- `fog.discovered` — 2D boolean array tracking revealed tiles
- `fog_update()` — marks tiles visible within the player's vision cone each frame
- Global coordinate conversion: rooms offset by `room.x/room.y` into the corridor grid
- Player cursor has 4 directional sprites; exits/shops highlighted

---

## Player Data (`avatar.js`)

Key globals on the `avatar` object:
- `x`, `y`, `map_id`, `facing` — position & orientation
- `hp`, `max_hp`, `mp`, `max_mp`
- `weapon` (0–7), `armor` (0–7), `spellbook` (0–6)
- `gold`, `bonus_atk`, `bonus_def`
- `campaign[]` — boolean flags for quest/story progression
- `sleeploc` — respawn point `[map, x, y]`

Persisted as JSON in a cookie (`mazesave`, 90-day expiry).

---

## Combat System (`combat.js`, `power.js`)

Turn-based, 6 phases: **INTRO → INPUT → OFFENSE → DEFENSE → VICTORY → DEFEAT**

- Hero: 20% miss, 10% crit (+max damage)
- Enemies: 30% miss
- Spells cost 1 MP: Heal (8 HP), Burn (AOE fire), Unlock (vs Automatons)
- Enemy categories: SHADOW(0), DEMON(1), UNDEAD(2), AUTOMATON(3)
- Boss (Death Speaker): bone shield up to 3× (+DEF), 66% attack / 33% scorch or shield

---

## Enemy Types (`enemy.js`)

| # | Name | HP | ATK | Gold | Category |
|---|---|---|---|---|---|
| 0 | Shadow Tendrils | 6 | 2–5 | 1–2 | Shadow |
| 1 | Imp | 7 | 2–6 | 1–3 | Demon |
| 2 | Shadow Soul | 8 | 3–8 | 2–4 | Shadow |
| 3 | Zombie | 12 | 4–10 | 3–6 | Undead |
| 4 | Skeleton | 18 | 6–12 | 5–8 | Undead |
| 5 | Druid | 16 | 7–14 | 7–12 | Demon |
| 6 | Mimic | 30 | 10–16 | 16–25 | Automaton |
| 7 | Death Speaker | 84 | 8–15 | 225–275 | Demon (BOSS) |

---

## Shop & Progression (`shop.js`, `dialog.js`)

9 shops: Cedar Arms, Fine Clothier, Pilgrim Inn, Sage Therel, Woodsman, Stonegate, Fence, Thieves Guild, A Nightmare.

Equipment tiers: Bare Fists → Great Sword (weapons), No Armor → Wyvern Scale (armor), No Spell → Reflect (spellbooks).

---

## Input (`input.js`)

- **Move:** Arrow keys or WASD
- **Action:** Space or Enter
- **Auto-explore toggle:** Tab
- **Mouse/Touch:** Click zones (`clickarea_up/down/left/right`), button hit detection

---

## Configuration (`config.js`, `title.js`)

`OPTIONS` object (cookie-persisted):
- `animation` — combat animation toggle
- `music` — background music
- `sfx` — sound effects
- `minimap` — minimap display

`PRESCALE` (1–8) selects the asset size variant from `prescaled/`.

---

## What Was Added / Changed

- **`dungeongenerator.js`** — New file. Full procedural dungeon generation replacing (or supplementing) the handcrafted atlas maps.
- **`minimap.js`** — Fog of war system added. `fog.discovered` grid, `fog_update()` vision cone logic, global coordinate conversion for rooms.
- **`atlas.js`** — Extended to support dungeon generator output (dynamic `atlas.maps`, `atlas.minimap_grid`, `atlas.rooms`).
- **`atlas.procedural`** flag — Set to `true` by dungeon generator; causes `mapscript_exec` to skip all handcrafted map scripts except the start room haybale.
- **`atlas.start_room_map_id`** — Map ID of the guaranteed 3×3 start room (always `rooms[0]`, always at grid position (1,1)).
- **Start room** — Always a 3×3 interior room force-placed at the top-left corner before random room generation. Has a hay pile (tile 17) at its center (local coords 2,2). Player spawns here; resting on the hay pile fully heals and sets the respawn point.
- **Auto-explore** (`explore.auto`) — Tab key toggles. BFS navigates the dungeon organically: in the corridor it prioritises doors to unexplored rooms (enters immediately when found); inside a room it fully explores the room before exiting. Doors to already-explored areas are skipped to prevent re-entry loops. Stops on combat, shop, full fog reveal, or any directional keypress. `AUTO_STEP_DELAY=7` frames between steps. Step count shown live top-right (`"N steps"`); on completion shows `"Explored in N steps"`.

---

## How to Run

Open `release/index.html` in any modern browser. No server required for local testing (though some browsers restrict `file://` audio — use a local HTTP server if music/sfx don't work).

```bash
# Simple local server options:
python3 -m http.server 8080        # then open http://localhost:8080/release/
npx serve release/
```
