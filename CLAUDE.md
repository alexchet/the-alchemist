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
│   ├── js/
│   │   ├── core/             # Engine primitives: config, utils, input, bitfont, sounds, images, loadbar
│   │   ├── world/            # Map data & rendering: dungeongenerator, mazemap, tileset, minimap
│   │   ├── entities/         # Game objects: enemy, avatar, worldenemy, boss
│   │   ├── combat/           # Combat mechanics: combat, power, treasure, mapscript
│   │   ├── states/           # Game states: explore, info, dialog, shop, title, action
│   │   └── engine/           # Game loop & state machine: gamestate, main
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
core/config.js → core/loadbar.js → core/utils.js → core/input.js → core/bitfont.js → core/sounds.js → core/images.js
→ entities/enemy.js  ← must precede dungeongenerator (IIFE uses ENEMY_* constants at parse time)
→ world/tileset.js → world/dungeongenerator.js → world/mazemap.js → world/minimap.js
→ entities/avatar.js → entities/worldenemy.js → entities/boss.js
→ combat/combat.js → combat/power.js → combat/treasure.js → combat/mapscript.js
→ states/action.js → states/explore.js → states/info.js → states/shop.js → states/dialog.js → states/title.js
→ engine/gamestate.js → engine/main.js
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
| `STATE_COMBAT` | 1 | Turn-based combat (legacy — only used by boss fight) |
| `STATE_INFO` | 2 | Character stats / inventory |
| `STATE_DIALOG` | 3 | Shop / NPC interaction |
| `STATE_TITLE` | 4 | Main menu |

---

## Module Reference

| File | Responsibility |
|---|---|
| `config.js` | Engine constants (`VIEW_WIDTH=160`, `VIEW_HEIGHT=120`, `PRESCALE`, `SCALE`, `OPTIONS`) |
| `utils.js` | Canvas scaling, cookie helpers (`setCookie`, `getCookie`), cheat/debug functions |
| `input.js` | Keyboard (arrows/WASD/Space/Enter), mouse, touch — `pressing` + `input_lock` objects |
| `bitfont.js` | Bitmap font renderer — white/red text, left/center/right justification |
| `sounds.js` | Web Audio `new Audio()` wrappers — 14 SFX constants + 4 music tracks |
| `images.js` | Generic image loader/renderer helper |
| `loadbar.js` | Asset preloading progress bar |
| `enemy.js` | Enemy definitions (8 types + boss), image loading, category constants, sprite renderer |
| `tileset.js` | 3D pseudo-perspective tile rendering — 19 tile types, 13 draw positions |
| `dungeongenerator.js` | **Procedural dungeon generation** (Hauberk/Bob Nystrom algorithm). Owns the `atlas` global. |
| `mazemap.js` | Active map state, 13-tile visibility cone, exit/shop checking, tile rendering, music control |
| `minimap.js` | **Minimap rendering + fog of war** — 1px/tile, 40×40 viewport, vision cone discovery |
| `avatar.js` | Player data (position, HP/MP, equipment, gold, campaign flags), movement, save/load |
| `worldenemy.js` | **World-space enemy system** — placement, patrol/alert AI, BFS pathfinding, in-world combat |
| `boss.js` | Death Speaker boss AI (bone shield mechanic). Legacy — only reachable via handcrafted maps. |
| `combat.js` | Legacy turn-based combat state machine. Unreachable in procedural dungeon; kept for future boss use. |
| `power.js` | Combat ability resolution (attack, heal, burn, unlock, run, boss powers) |
| `treasure.js` | Loot rendering (gold icons, stat gems) and pickup logic |
| `mapscript.js` | Tile-triggered events. Bone pile / locked door data references handcrafted map IDs — dead for procedural dungeon. Haybale script is still active. |
| `action.js` | Action button grid — layout, selection navigation, context-awareness |
| `explore.js` | Exploration state — movement, map transitions, shop entry, in-world combat, defeat overlay, auto-explore |
| `info.js` | Character stats screen renderer |
| `shop.js` | Shop data (9 shops, weapons/armor/spells/messages) and transaction logic |
| `dialog.js` | Shop conversation UI — 2-item display, mouse/keyboard navigation |
| `title.js` | Main menu + options (animation, music, sfx, minimap — persisted to cookies) |
| `gamestate.js` | State machine — dispatches logic/render to the active state |
| `main.js` | `init()` entry point, 60 FPS game loop |

---

## Map System

### Procedural Dungeon (`dungeongenerator.js`)

`atlas.js` (handcrafted maps) has been **removed from the build**. The dungeon generator is the sole owner of the `atlas` global.

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

**Enemy placement:** Each room except `rooms[0]` (safe start room) gets `enemy_placement` — 1 enemy for small rooms, 2 for large (area > 15 tiles), random types from `[SHADOW_TENDRILS, IMP, SHADOW_SOUL, ZOMBIE, SKELETON, DRUID]`.

> ⚠️ `enemy.js` **must load before** `dungeongenerator.js` in `index.html`. The dungeon generator is an IIFE that uses `ENEMY_*` constants at parse time.

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

Key fields on the `avatar` object:
- `x`, `y`, `map_id`, `facing` — position & orientation
- `hp`, `max_hp`, `mp`, `max_mp`
- `weapon` (0–7), `armor` (0–7), `spellbook` (0–6)
- `gold`, `bonus_atk`, `bonus_def`
- `campaign[]` — boolean flags for quest/story progression
- `sleeploc` — respawn point `[map, x, y]`

Persisted as JSON in a cookie (`mazesave`, 90-day expiry).
`avatar` is declared `let` because `avatar_init()` replaces it wholesale with `JSON.parse()` on continue.

---

## Combat System (`worldenemy.js`, `power.js`)

**In-world, per-step** — no separate combat screen. Combat happens in `STATE_EXPLORE`.

- Player acts first each step (move OR attack/spell), then all adjacent alert enemies attack back
- Hero attack: 20% miss, 10% crit (+max weapon damage), targets enemy directly in front
- Burn (AOE): hits all adjacent enemies; 2× damage vs Undead, normal vs Demons, 1× crit vs others
- Heal: restores 50–100% of max HP, costs 1 MP
- Enemy attack: 30% miss, 5% crit (+min damage), reduced by armor DEF
- Spells cost 1 MP. Enemy categories: SHADOW(0), DEMON(1), UNDEAD(2), AUTOMATON(3)

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

9 shops defined (Cedar Arms, Fine Clothier, Pilgrim Inn, Sage Therel, Woodsman, Stonegate, Fence, Thieves Guild, A Nightmare). Shop data is loaded but shops are only reachable if `atlas.maps[id].shops` has entries — procedural maps currently have empty shop arrays.

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

## Code Style Conventions

All module-level declarations use `const` or `let` — no `var` at module scope:
- `const` — anything never reassigned (named constants, object/array references whose identity doesn't change)
- `let` — anything reassigned at runtime (`SCALE`, `OPTIONS`, `gamestate`, `world_enemies`, `avatar`, `mouse_pos`, etc.)

`new Object()` / `new Array()` inside function bodies are acceptable and not worth changing.

---

## What Was Added / Changed

- **Folder structure** — JS split into `core/`, `world/`, `entities/`, `combat/`, `states/`, `engine/` subfolders.
- **`var` → `const`/`let`** — All module-level declarations across all 28 files updated.
- **`atlas.js` removed from build** — Handcrafted map data no longer loaded. `dungeongenerator.js` solely owns `atlas`. The file still exists on disk at `release/js/world/atlas.js` but is not in `index.html`.
- **`dungeongenerator.js`** — New file. Full procedural dungeon generation. Owns `atlas`. Enemy placement runs at parse time (IIFE) — requires `enemy.js` to load first.
- **`minimap.js`** — Fog of war system added. `fog.discovered` grid, `fog_update()` vision cone logic, global coordinate conversion for rooms. Calls `we_render_minimap()` to draw enemy dots after tile loop.
- **`title_start()`** — Simplified: goes directly to `STATE_EXPLORE` instead of routing through the old Heroine Dusk intro dialog (shop 8).
- **`mazemap_set_music()`** — Guards against undefined/null song filenames (returns early).
- **Auto-explore** (`explore.auto`) — Tab key toggles. BFS navigates the dungeon organically: in the corridor it prioritises doors to unexplored rooms (enters immediately when found); inside a room it fully explores the room before exiting. Doors to already-explored areas are skipped to prevent re-entry loops. Stops on shop, full fog reveal, directional keypress, or **enemy detected nearby**. `AUTO_STEP_DELAY=7` frames between steps. Step count shown live top-right (`"N steps"`); on completion shows `"Explored in N steps"`.
- **`worldenemy.js`** — New file. World-space enemies placed in rooms by the dungeon generator. Per-step AI (fires after every player action): idle enemies patrol randomly within `WE_PATROL_RADIUS=4` tiles of home; alert enemies BFS-pathfind toward the player and can follow through doors; give up at `WE_GIVE_UP_SQ=400` (20 tile) euclidean distance. Detection is **same-map only** using local squared distance (`we_local_dist_sq`) — enemies in rooms cannot detect through closed doors. `WE_DETECT_RADIUS=6`. In-world combat: player attacks enemy directly in front; Burn hits all adjacent enemies; all adjacent alert enemies attack back each step. Kill message shown for 90 frames. Defeat triggers respawn overlay. Enemies respawn on rest (hay pile). Enemy dots shown on minimap (orange=idle, red=alert). Enemy sprite scales by forward distance: dist 1=full (160×120), dist 2=half, dist 3=quarter.
- **`explore.js`** — Random encounters removed. In-world combat messages added (`combat_action/result`, `enemy_name/action/result`, `kill_message`). Defeat overlay added. Attack and Burn usable from the explore HUD. Action button checks run **before** `avatar_explore()` so mouse clicks aren't consumed by movement. `we_get_forward_enemy()` used for LOS-aware enemy sprite rendering (up to 3 tiles, blocked by walls/doors).
- **`avatar.js`** — `avatar_move()` checks `we_tile_occupied()` before moving; blocked by enemies.
- **`action.js`** — Attack button now shown in `STATE_EXPLORE` as well as `STATE_COMBAT`.
- **`mapscript.js`** — `mapscript_haybale()` calls `we_respawn_all()` after `avatar_sleep()`.
- **`main.js`** — `we_init()` called after `enemy_init()` on startup.

---

## Known Bugs (as of 2026-04-04)

The in-world combat sequence has unresolved bugs — **next priority**:

- Combat flow (attack/spell input, damage, enemy retaliation, message display) may have issues
- Not yet investigated — fixing load order and architecture cleanup was the last completed work

---

## Dead Code / Legacy Systems (kept intentionally)

- **`combat.js`** — Full turn-based combat screen (`STATE_COMBAT`). Unreachable in the procedural dungeon. Kept because it will be reused for a future boss fight system.
- **`boss.js`** — Death Speaker AI. Only triggered by `mapscript.js` which references handcrafted map IDs. Kept for future use.
- **`mapscript.js` bone pile / locked door data** — Hardcoded to handcrafted map IDs 8, 9, 10. Dead for procedural dungeon. The haybale handler is still active and used.
- **`atlas.js` on disk** — Not loaded. Safe to delete or archive if desired.

---

## How to Run

Open `release/index.html` in any modern browser. No server required for local testing (though some browsers restrict `file://` audio — use a local HTTP server if music/sfx don't work).

```bash
# Simple local server options:
python3 -m http.server 8080        # then open http://localhost:8080/release/
npx serve release/
```
