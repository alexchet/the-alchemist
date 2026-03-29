/**
 * dungeongenerator.js
 * Procedurally generated dungeon using the Hauberk maze-dungeon algorithm.
 * Adapted from Bob Nystrom's Dart implementation (github.com/munificent/hauberk).
 *
 * To use: in index.html, replace js/atlas.js with js/dungeongenerator.js
 * Note: clear browser cookies to reset avatar position if continuing a saved game.
 *
 * Algorithm:
 *   1. Place randomly-sized rooms (odd dimensions, no overlap)
 *   2. Fill all remaining wall space with growing-tree mazes
 *   3. Find connector tiles — walls adjacent to two different regions
 *   4. Randomly open connectors until every region is joined
 *   5. Remove dead ends (open tiles with only one exit)
 *   6. Find room connections — FLOOR tiles adjacent to room CEIL tiles
 *
 * Map structure:
 *   atlas.maps[0]   = corridor/maze map (room footprints are solid walls)
 *   atlas.maps[1..N] = one map per room, with exits back to the corridor
 *
 * Tile legend:
 *   1  = dungeon_floor    (walkable)  -- maze corridors
 *   2  = dungeon_wall     (blocked)
 *   5  = dungeon_ceiling  (walkable)  -- roofed room interior
 */

var atlas = new Object();
atlas.maps = new Array();

(function() {
  // Stage dimensions must be odd for the maze algorithm to align correctly.
  var W = 41, H = 41;

  var WALL  = 2;
  var FLOOR = 1;
  var CEIL  = 5;
  var DOOR  = 3;

  var NUM_ROOM_TRIES         = 150;
  var ROOM_EXTRA_SIZE        = 0;   // increase for larger rooms
  var WINDING_PERCENT        = 0;   // 0 = straight corridors, 100 = very windy
  var EXTRA_CONNECTOR_CHANCE = 20;  // 1-in-N chance of a redundant connector (loops)

  // Cardinal directions as [dx, dy].
  var DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  // ------------------------------------------------------------------ grid --

  var grid = [];
  var regions = [];
  for (var y = 0; y < H; y++) {
    grid[y] = [];
    regions[y] = [];
    for (var x = 0; x < W; x++) {
      grid[y][x] = WALL;
      regions[y][x] = null;
    }
  }

  function get_tile(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return WALL;
    return grid[y][x];
  }

  function set_tile(x, y, tile) {
    if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = tile;
  }

  function get_region(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return regions[y][x];
  }

  var current_region = -1;

  function start_region() {
    current_region++;
  }

  function carve(x, y, tile) {
    if (tile === undefined) tile = FLOOR;
    set_tile(x, y, tile);
    regions[y][x] = current_region;
  }

  // ----------------------------------------------------------------- rooms --

  var rooms = []; // { x, y, w, h, cx, cy }

  function add_rooms() {
    for (var i = 0; i < NUM_ROOM_TRIES; i++) {
      // Odd room dimensions so they line up with the maze grid.
      var size = (Math.floor(Math.random() * (2 + ROOM_EXTRA_SIZE)) + 1) * 2 + 1;
      var rectangularity = Math.floor(Math.random() * (1 + Math.floor(size / 2))) * 2;
      var w = size, h = size;
      if (Math.random() < 0.5) w += rectangularity;
      else                     h += rectangularity;

      // Snap position to odd coordinates.
      var x = Math.floor(Math.random() * Math.floor((W - w) / 2)) * 2 + 1;
      var y = Math.floor(Math.random() * Math.floor((H - h) / 2)) * 2 + 1;

      // Reject if the new room touches or overlaps any existing room.
      var overlaps = false;
      for (var r = 0; r < rooms.length; r++) {
        var rm = rooms[r];
        var dx = Math.max(0, Math.max(rm.x - (x + w), x - (rm.x + rm.w)));
        var dy = Math.max(0, Math.max(rm.y - (y + h), y - (rm.y + rm.h)));
        if (dx <= 0 && dy <= 0) { overlaps = true; break; }
      }
      if (overlaps) continue;

      rooms.push({
        x: x, y: y, w: w, h: h,
        cx: Math.floor(x + w / 2),
        cy: Math.floor(y + h / 2)
      });

      start_region();
      for (var ry = y; ry < y + h; ry++)
        for (var rx = x; rx < x + w; rx++)
          carve(rx, ry, CEIL);
    }
  }

  // ----------------------------------------------------------------- mazes --

  function can_carve(x, y, dx, dy) {
    // The step two tiles ahead must be in bounds.
    var ex = x + dx * 3, ey = y + dy * 3;
    if (ex < 0 || ey < 0 || ex >= W || ey >= H) return false;
    // Destination must still be a wall.
    return get_tile(x + dx * 2, y + dy * 2) === WALL;
  }

  // Growing-tree maze (always extends from the most-recently-added cell).
  // Carves two tiles per step so corridors stay on the odd-coordinate grid.
  function grow_maze(sx, sy) {
    var cells    = [[sx, sy]];
    var last_dir = -1;

    start_region();
    carve(sx, sy);

    while (cells.length > 0) {
      var cell = cells[cells.length - 1];
      var cx = cell[0], cy = cell[1];

      var unmade = [];
      for (var d = 0; d < DIRS.length; d++) {
        if (can_carve(cx, cy, DIRS[d][0], DIRS[d][1])) unmade.push(d);
      }

      if (unmade.length > 0) {
        // Prefer the last direction for straighter corridors (tuned by WINDING_PERCENT).
        var dir;
        if (last_dir !== -1 && unmade.indexOf(last_dir) !== -1 &&
            Math.floor(Math.random() * 100) > WINDING_PERCENT) {
          dir = last_dir;
        } else {
          dir = unmade[Math.floor(Math.random() * unmade.length)];
        }

        var ddx = DIRS[dir][0], ddy = DIRS[dir][1];
        carve(cx + ddx,     cy + ddy);
        carve(cx + ddx * 2, cy + ddy * 2);
        cells.push([cx + ddx * 2, cy + ddy * 2]);
        last_dir = dir;
      } else {
        cells.pop();
        last_dir = -1;
      }
    }
  }

  // -------------------------------------------------------- connect regions --

  function add_junction(x, y) {
    set_tile(x, y, FLOOR);
  }

  function connect_regions() {
    // Find every wall tile that borders two or more distinct regions.
    var connector_regions = {};
    for (var y = 1; y < H - 1; y++) {
      for (var x = 1; x < W - 1; x++) {
        if (get_tile(x, y) !== WALL) continue;

        var adj = new Set();
        for (var d = 0; d < DIRS.length; d++) {
          var r = get_region(x + DIRS[d][0], y + DIRS[d][1]);
          if (r !== null) adj.add(r);
        }
        if (adj.size < 2) continue;
        connector_regions[x + ',' + y] = adj;
      }
    }

    var connectors = Object.keys(connector_regions);

    // merged[i] is the canonical region ID for region i.
    var merged = {};
    var open_regions = new Set();
    for (var i = 0; i <= current_region; i++) {
      merged[i] = i;
      open_regions.add(i);
    }

    while (open_regions.size > 1 && connectors.length > 0) {
      var key   = connectors[Math.floor(Math.random() * connectors.length)];
      var parts = key.split(',');
      var jx    = parseInt(parts[0]);
      var jy    = parseInt(parts[1]);

      add_junction(jx, jy);

      // Resolve which canonical regions this junction connects.
      var regs    = Array.from(connector_regions[key]).map(function(r) { return merged[r]; });
      var dest    = regs[0];
      var sources = regs.slice(1);

      // Merge every source region into dest.
      var sources_set = new Set(sources);
      for (var i = 0; i <= current_region; i++) {
        if (sources_set.has(merged[i])) merged[i] = dest;
      }
      sources.forEach(function(s) { open_regions.delete(s); });

      // Remove connectors that are now redundant.
      connectors = connectors.filter(function(k) {
        var p  = k.split(',');
        var kx = parseInt(p[0]);
        var ky = parseInt(p[1]);

        // Discard connectors adjacent to the junction we just placed.
        if (Math.abs(kx - jx) < 2 && Math.abs(ky - jy) < 2) return false;

        // Keep connectors that still span two different regions.
        var k_regs = new Set(
          Array.from(connector_regions[k]).map(function(r) { return merged[r]; })
        );
        if (k_regs.size > 1) return true;

        // Occasionally add a redundant connection to create loops.
        if (Math.floor(Math.random() * EXTRA_CONNECTOR_CHANCE) === 0) add_junction(kx, ky);
        return false;
      });
    }
  }

  // ------------------------------------------------------ remove dead ends --

  function remove_dead_ends() {
    var done = false;
    while (!done) {
      done = true;
      for (var y = 1; y < H - 1; y++) {
        for (var x = 1; x < W - 1; x++) {
          if (get_tile(x, y) === WALL) continue;
          var exits = 0;
          for (var d = 0; d < DIRS.length; d++) {
            if (get_tile(x + DIRS[d][0], y + DIRS[d][1]) !== WALL) exits++;
          }
          if (exits === 1) {
            done = false;
            set_tile(x, y, WALL);
          }
        }
      }
    }
  }

  // ---------------------------------------------------- find connections ---
  // Scans each room's perimeter for FLOOR tiles in the full grid.
  // Each such tile is a corridor-to-room junction point.
  // approach = which side of the room the corridor is on.

  function find_connections() {
    var connections = [];
    for (var r = 0; r < rooms.length; r++) {
      var room = rooms[r];

      // North side: corridor above the room (low y in grid = north on screen)
      for (var x = room.x; x < room.x + room.w; x++) {
        if (get_tile(x, room.y - 1) === FLOOR)
          connections.push({ cx: x, cy: room.y - 1, room_idx: r, approach: "north" });
      }
      // South side: corridor below the room
      for (var x = room.x; x < room.x + room.w; x++) {
        if (get_tile(x, room.y + room.h) === FLOOR)
          connections.push({ cx: x, cy: room.y + room.h, room_idx: r, approach: "south" });
      }
      // West side: corridor left of the room
      for (var y = room.y; y < room.y + room.h; y++) {
        if (get_tile(room.x - 1, y) === FLOOR)
          connections.push({ cx: room.x - 1, cy: y, room_idx: r, approach: "west" });
      }
      // East side: corridor right of the room
      for (var y = room.y; y < room.y + room.h; y++) {
        if (get_tile(room.x + room.w, y) === FLOOR)
          connections.push({ cx: room.x + room.w, cy: y, room_idx: r, approach: "east" });
      }
    }
    return connections;
  }

  // --------------------------------------------------------------- run it --

  add_rooms();

  // Grow mazes in every odd-coordinate wall cell not already inside a room.
  for (var y = 1; y < H; y += 2) {
    for (var x = 1; x < W; x += 2) {
      if (get_tile(x, y) !== WALL) continue;
      grow_maze(x, y);
    }
  }

  connect_regions();
  remove_dead_ends();

  var connections = find_connections();

  // -------------------------------------------------- build corridor grid --
  // Room interiors (CEIL) become solid wall. Connection tiles stay FLOOR for
  // now — they will be changed to DOOR during exit wiring below.

  var corridor_grid = [];
  for (var y = 0; y < H; y++) {
    corridor_grid[y] = [];
    for (var x = 0; x < W; x++) {
      corridor_grid[y][x] = (grid[y][x] === CEIL) ? WALL : grid[y][x];
    }
  }

  // ---------------------------------------------------- build room grids --
  // Each room gets a clean rectangular map: CEIL interior, WALL border.
  // Size = (room.w + 2) x (room.h + 2) to include the wall border.

  var room_grids      = [];
  var room_exits_list = [];

  for (var r = 0; r < rooms.length; r++) {
    var room = rooms[r];
    var rw = room.w + 2;
    var rh = room.h + 2;
    var rg = [];
    for (var y = 0; y < rh; y++) {
      rg[y] = [];
      for (var x = 0; x < rw; x++) {
        rg[y][x] = (x === 0 || x === rw - 1 || y === 0 || y === rh - 1) ? WALL : CEIL;
      }
    }
    room_grids.push(rg);
    room_exits_list.push([]);
  }

  // ------------------------------------------------------ wire up exits --
  //
  // For each connection (corridor tile adjacent to a room):
  //
  //   Corridor exit: stepping on the junction tile (cx, cy) teleports the
  //   player into the room map at spawn_x/spawn_y (one step inside the room
  //   from the entry wall so they don't immediately re-exit).
  //
  //   Room exit: stepping on exit_x/exit_y (the interior tile against the
  //   entry wall) teleports the player back to the corridor at ret_x/ret_y
  //   (one step away from the junction, deeper into the corridor).
  //
  // Local room coords use a 1-tile wall border offset:
  //   local_x = global_x - room.x + 1
  //   local_y = global_y - room.y + 1

  var corridor_exits = [];
  var start_x = -1, start_y = -1;

  for (var i = 0; i < connections.length; i++) {
    var conn = connections[i];
    var cx = conn.cx, cy = conn.cy;
    var r = conn.room_idx;
    var room = rooms[r];
    var dest_map = r + 1; // room maps start at atlas index 1

    // wall_dx/wall_dy: the WALL tile in the corridor grid that becomes a DOOR.
    // This is the room's outer face — the tile that would block the corridor.
    // Mirrors the original atlas where doors replace wall tiles, not floor tiles.
    var wall_dx, wall_dy;

    // exit_x/exit_y: the border WALL tile in the room map that becomes a DOOR.
    // spawn_x/spawn_y: the first interior CEIL tile — where the player lands.
    var spawn_x, spawn_y;
    var exit_x,  exit_y;

    switch (conn.approach) {
      case "north": // corridor above room (cy = room.y - 1)
        var lx  = cx - room.x + 1;
        wall_dx = cx;                wall_dy = room.y;           // north face of room footprint
        exit_x  = lx;               exit_y  = 0;                // north border wall of room map
        spawn_x = lx;               spawn_y = 1;                // first interior row
        break;

      case "south": // corridor below room (cy = room.y + room.h)
        var lx  = cx - room.x + 1;
        wall_dx = cx;                wall_dy = room.y + room.h - 1; // south face of room footprint
        exit_x  = lx;               exit_y  = room.h + 1;          // south border wall of room map
        spawn_x = lx;               spawn_y = room.h;               // last interior row
        break;

      case "west": // corridor left of room (cx = room.x - 1)
        var ly  = cy - room.y + 1;
        wall_dx = room.x;            wall_dy = cy;               // west face of room footprint
        exit_x  = 0;                 exit_y  = ly;               // west border wall of room map
        spawn_x = 1;                 spawn_y = ly;               // first interior column
        break;

      case "east": // corridor right of room (cx = room.x + room.w)
        var ly  = cy - room.y + 1;
        wall_dx = room.x + room.w - 1; wall_dy = cy;            // east face of room footprint
        exit_x  = room.w + 1;          exit_y  = ly;            // east border wall of room map
        spawn_x = room.w;               spawn_y = ly;            // last interior column
        break;
    }

    // The connection tile (cx, cy) is the floor tile just outside the door.
    // It stays as FLOOR and serves as the return landing position from the room.
    if (start_x === -1) { start_x = cx; start_y = cy; }

    // Door goes into the corridor wall face — replaces WALL with DOOR.
    corridor_grid[wall_dy][wall_dx] = DOOR;

    // Door goes into the room border wall — replaces the border WALL with DOOR.
    room_grids[r][exit_y][exit_x] = DOOR;

    // Corridor exit: step on door in wall → land on first interior tile of room.
    corridor_exits.push({
      exit_x: wall_dx, exit_y: wall_dy,
      dest_map: dest_map,
      dest_x: spawn_x,  dest_y: spawn_y
    });

    // Room exit: step on border door → land back on the corridor floor tile (cx, cy).
    room_exits_list[r].push({
      exit_x: exit_x,  exit_y: exit_y,
      dest_map: 0,
      dest_x: cx,      dest_y: cy
    });
  }

  // Fallback start if no connections were found (degenerate generation).
  if (start_x === -1) { start_x = 1; start_y = 1; }

  // ================================================= store atlas data ==

  // Map 0: the corridor/maze
  atlas.maps[0] = {
    name:          "Dungeon",
    music:         "elegy_dm",
    width:         W,
    height:        H,
    background:    0,
    tiles:         corridor_grid,
    exits:         corridor_exits,
    shops:         [],
    enemies:       [],
    start_x:       start_x,
    start_y:       start_y,
    start_facing:  "south"
  };

  // Maps 1..N: individual rooms
  for (var r = 0; r < rooms.length; r++) {
    var room = rooms[r];
    atlas.maps[r + 1] = {
      name:       "Room " + (r + 1),
      music:      "elegy_dm",
      width:      room.w + 2,
      height:     room.h + 2,
      background: 0,
      tiles:      room_grids[r],
      exits:      room_exits_list[r],
      shops:      [],
      enemies:    []
    };
  }

})();
