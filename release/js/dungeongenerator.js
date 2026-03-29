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
 *
 * Tile legend:
 *   0  = empty (no tile)
 *   1  = dungeon_floor    (walkable)  -- maze corridors
 *   2  = dungeon_wall     (blocked)   -- standard wall
 *   3  = dungeon_door     (walkable)  -- region junction
 *   5  = dungeon_ceiling  (walkable)  -- roofed room interior
 */

// Keep MAP_COUNT at 11 so saved-game map IDs don't crash on load.
var MAP_COUNT = 11;

var atlas = new Object();
atlas.maps = new Array();

for (var i = 0; i < MAP_COUNT; i++) {
  atlas.maps[i] = new Object();
  atlas.maps[i].exits   = new Array();
  atlas.maps[i].enemies = new Array();
  atlas.maps[i].shops   = new Array();
}

(function() {
  // Stage dimensions must be odd for the maze algorithm to align correctly.
  var W = 41, H = 41;

  var WALL   = 2;
  var FLOOR  = 1;   // maze corridors
  var CEIL   = 5;   // roofed room interior
  var DOOR   = 3;   // region junction
  // var CORNER = 4;   // convex wall corner column (unused)

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

  // ----------------------------------------------------------- place doors --
  // Run after dead ends are removed. A FLOOR tile becomes a DOOR when it sits
  // at the mouth of a 1-tile-wide corridor leading into a room (CEIL):
  //   - one cardinal neighbour is CEIL, AND
  //   - both sides of the perpendicular axis are WALL.
  // This guarantees exactly one door per corridor-to-room entry.

  function add_doors() {
    // A FLOOR tile becomes a DOOR only when it is the mouth of a 1-tile-wide
    // corridor approaching a room from the south (room to the north, tn===CEIL)
    // or from the east (room to the west, tw===CEIL).
    // Using one canonical direction per axis guarantees exactly one door per
    // corridor-to-room connection regardless of corridor length.
    for (var y = 1; y < H - 1; y++) {
      for (var x = 1; x < W - 1; x++) {
        if (get_tile(x, y) !== FLOOR) continue;
        var tn = get_tile(x, y - 1), ts = get_tile(x, y + 1);
        var te = get_tile(x + 1, y), tw = get_tile(x - 1, y);
        if (tn === CEIL && te === WALL && tw === WALL) { set_tile(x, y, DOOR); continue; }
        if (tw === CEIL && tn === WALL && ts === WALL) { set_tile(x, y, DOOR); }
      }
    }
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
  add_doors();

  // ================================================= store atlas data ==

  var start = rooms.length > 0
    ? rooms[0]
    : { cx: Math.floor(W / 2), cy: Math.floor(H / 2) };

  atlas.maps[0].name         = "Dungeon";
  atlas.maps[0].music        = "elegy_dm";
  atlas.maps[0].width        = W;
  atlas.maps[0].height       = H;
  atlas.maps[0].background   = 0;
  atlas.maps[0].tiles        = grid;
  atlas.maps[0].enemies      = [];
  atlas.maps[0].start_x      = start.cx;
  atlas.maps[0].start_y      = start.cy;
  atlas.maps[0].start_facing = "south";

  // All other map slots alias to the same dungeon so saved-game IDs don't crash.
  for (var k = 1; k < MAP_COUNT; k++) {
    atlas.maps[k].name         = atlas.maps[0].name;
    atlas.maps[k].music        = atlas.maps[0].music;
    atlas.maps[k].width        = atlas.maps[0].width;
    atlas.maps[k].height       = atlas.maps[0].height;
    atlas.maps[k].background   = atlas.maps[0].background;
    atlas.maps[k].tiles        = atlas.maps[0].tiles;
    atlas.maps[k].enemies      = atlas.maps[0].enemies;
    atlas.maps[k].start_x      = atlas.maps[0].start_x;
    atlas.maps[k].start_y      = atlas.maps[0].start_y;
    atlas.maps[k].start_facing = atlas.maps[0].start_facing;
  }

})();
