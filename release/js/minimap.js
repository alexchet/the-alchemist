/**
 * Minimap
 * Shown in the Info screen
 */

var MINIMAP_ICON_SIZE = 3; // pixels — source sprite size (do not change)
var MINIMAP_TILE_PX   = 1; // pixels — rendered size per tile on screen
 
var MINIMAP_ICON_NONWALKABLE = 0;
var MINIMAP_ICON_WALKABLE = 1;
// var MINIMAP_ICON_HEROINE = 2;
var MINIMAP_ICON_EXIT = 3;

var MINIMAP_MARGIN_LEFT = 2;
var MINIMAP_MARGIN_TOP = 2;

var MINIMAP_CURSOR_WEST = 0;
var MINIMAP_CURSOR_NORTH = 1;
var MINIMAP_CURSOR_EAST = 2;
var MINIMAP_CURSOR_SOUTH = 3;


var minimap = new Object();

minimap.img = new Image();
minimap.img_loaded = false;
minimap.cursor = new Image();
minimap.cursor_loaded = false;

// ----------------------------------------------------------------- fog --
// fog.discovered is a 2D boolean array in global dungeon coordinates.
// Tiles are marked true when they fall inside the player's visibility cone.
// Initialized lazily on first update so atlas dimensions are guaranteed ready.

var fog = new Object();
fog.discovered = null;

function fog_ensure_init() {
  if (fog.discovered || !atlas.minimap_grid) return;
  fog.discovered = [];
  for (var y = 0; y < atlas.minimap_height; y++) {
    fog.discovered[y] = [];
    for (var x = 0; x < atlas.minimap_width; x++) {
      fog.discovered[y][x] = false;
    }
  }
}

// Mark a global dungeon coord as discovered.
function fog_mark(gx, gy) {
  if (gx < 0 || gy < 0 || gx >= atlas.minimap_width || gy >= atlas.minimap_height) return;
  fog.discovered[gy][gx] = true;
}

// Called from mazemap_render_tile for each tile drawn to screen.
// Converts local map coords to global minimap coords and marks as discovered.
// When in the corridor, skips room-interior positions (tile 5 = CEIL) —
// they render as WALL in the corridor, so the player never actually sees them.
// Returns true if the tile at local (lx,ly) lets you see through it.
// Walls and doors are opaque — you see them but not what's behind them.
function fog_can_see_through(lx, ly) {
  var tile = mazemap_get_tile(lx, ly);
  return tileset.walkable[tile] && tile !== 3;
}

// Called from minimap_render. Marks the tiles the player can actually see:
// front + middle row always visible; back row only if middle tile is see-through.
function fog_update() {
  fog_ensure_init();
  if (!fog.discovered) return;

  var x = avatar.x, y = avatar.y;

  if (avatar.facing === "north") {
    // front row (depth 1)
    fog_mark_local(x-1,y);   fog_mark_local(x,y);   fog_mark_local(x+1,y);
    // middle row (depth 2): outer tiles only if front side is see-through
    if (fog_can_see_through(x-1,y)) fog_mark_local(x-2,y-1);
    if (fog_can_see_through(x+1,y)) fog_mark_local(x+2,y-1);
    fog_mark_local(x-1,y-1); fog_mark_local(x,y-1); fog_mark_local(x+1,y-1);
    // back row (depth 3): outer tiles need full line of sight (front side + middle)
    if (fog_can_see_through(x-1,y) && fog_can_see_through(x-2,y-1)) fog_mark_local(x-2,y-2);
    if (fog_can_see_through(x+1,y) && fog_can_see_through(x+2,y-1)) fog_mark_local(x+2,y-2);
    if (fog_can_see_through(x-1,y-1)) fog_mark_local(x-1,y-2);
    if (fog_can_see_through(x+1,y-1)) fog_mark_local(x+1,y-2);
    if (fog_can_see_through(x,  y-1)) fog_mark_local(x,  y-2);
  } else if (avatar.facing === "south") {
    // front row
    fog_mark_local(x+1,y);   fog_mark_local(x,y);   fog_mark_local(x-1,y);
    // middle row outer: gated on front side
    if (fog_can_see_through(x+1,y)) fog_mark_local(x+2,y+1);
    if (fog_can_see_through(x-1,y)) fog_mark_local(x-2,y+1);
    fog_mark_local(x+1,y+1); fog_mark_local(x,y+1); fog_mark_local(x-1,y+1);
    // back row outer: full line of sight
    if (fog_can_see_through(x+1,y) && fog_can_see_through(x+2,y+1)) fog_mark_local(x+2,y+2);
    if (fog_can_see_through(x-1,y) && fog_can_see_through(x-2,y+1)) fog_mark_local(x-2,y+2);
    if (fog_can_see_through(x+1,y+1)) fog_mark_local(x+1,y+2);
    if (fog_can_see_through(x-1,y+1)) fog_mark_local(x-1,y+2);
    if (fog_can_see_through(x,  y+1)) fog_mark_local(x,  y+2);
  } else if (avatar.facing === "west") {
    // front row
    fog_mark_local(x,y+1);   fog_mark_local(x,y);   fog_mark_local(x,y-1);
    // middle row outer: gated on front side
    if (fog_can_see_through(x,y+1)) fog_mark_local(x-1,y+2);
    if (fog_can_see_through(x,y-1)) fog_mark_local(x-1,y-2);
    fog_mark_local(x-1,y+1); fog_mark_local(x-1,y); fog_mark_local(x-1,y-1);
    // back row outer: full line of sight
    if (fog_can_see_through(x,y+1) && fog_can_see_through(x-1,y+2)) fog_mark_local(x-2,y+2);
    if (fog_can_see_through(x,y-1) && fog_can_see_through(x-1,y-2)) fog_mark_local(x-2,y-2);
    if (fog_can_see_through(x-1,y+1)) fog_mark_local(x-2,y+1);
    if (fog_can_see_through(x-1,y-1)) fog_mark_local(x-2,y-1);
    if (fog_can_see_through(x-1,y  )) fog_mark_local(x-2,y  );
  } else { // east
    // front row
    fog_mark_local(x,y-1);   fog_mark_local(x,y);   fog_mark_local(x,y+1);
    // middle row outer: gated on front side
    if (fog_can_see_through(x,y-1)) fog_mark_local(x+1,y-2);
    if (fog_can_see_through(x,y+1)) fog_mark_local(x+1,y+2);
    fog_mark_local(x+1,y-1); fog_mark_local(x+1,y); fog_mark_local(x+1,y+1);
    // back row outer: full line of sight
    if (fog_can_see_through(x,y-1) && fog_can_see_through(x+1,y-2)) fog_mark_local(x+2,y-2);
    if (fog_can_see_through(x,y+1) && fog_can_see_through(x+1,y+2)) fog_mark_local(x+2,y+2);
    if (fog_can_see_through(x+1,y-1)) fog_mark_local(x+2,y-1);
    if (fog_can_see_through(x+1,y+1)) fog_mark_local(x+2,y+1);
    if (fog_can_see_through(x+1,y  )) fog_mark_local(x+2,y  );
  }
}

function fog_mark_local(lx, ly) {
  if (!fog.discovered) return;
  var gx, gy;
  if (avatar.map_id === 0) {
    gx = lx; gy = ly;
    if (atlas.minimap_grid &&
        gx >= 0 && gy >= 0 && gx < atlas.minimap_width && gy < atlas.minimap_height &&
        atlas.minimap_grid[gy][gx] === 5) return;
  } else {
    if (!atlas.rooms || !atlas.rooms[avatar.map_id - 1]) return;
    var room = atlas.rooms[avatar.map_id - 1];
    gx = room.x + (lx - 1);
    gy = room.y + (ly - 1);
  }
  fog_mark(gx, gy);
}



function minimap_init() {

  minimap.img.src = "images/interface/minimap.png";
  minimap.img.onload = function() {minimap_img_onload();};

  minimap.cursor.src = "images/interface/minimap_cursor.png";
  minimap.cursor.onload = function() {minimap_cursor_onload();};
  
}

function minimap_img_onload() {
  minimap.img_loaded = true;
}
function minimap_cursor_onload() {
  minimap.cursor_loaded = true;
}


var MINIMAP_VIEW = 40; // viewport size in tiles

// Returns the player's position in global dungeon coordinates.
// When in the corridor (map 0) this is just avatar.x/y.
// When inside a room (map 1+) the local room coords are converted back
// using the stored room bounds: global = room.topLeft + (local - 1).
function minimap_global_player_pos() {
  if (!atlas.rooms || avatar.map_id === 0) {
    return { x: avatar.x, y: avatar.y };
  }
  var room = atlas.rooms[avatar.map_id - 1];
  return {
    x: room.x + (avatar.x - 1),
    y: room.y + (avatar.y - 1)
  };
}

// Reads a tile from the merged full-dungeon grid, falling back to the
// active mazemap if the minimap grid is not available (e.g. original atlas).
function minimap_get_tile(gx, gy) {
  if (atlas.minimap_grid) {
    if (gx < 0 || gy < 0 || gx >= atlas.minimap_width || gy >= atlas.minimap_height) return 0;
    return atlas.minimap_grid[gy][gx];
  }
  return mazemap_get_tile(gx, gy);
}

function minimap_render() {

  var map_w = atlas.minimap_grid ? atlas.minimap_width  : mazemap.width;
  var map_h = atlas.minimap_grid ? atlas.minimap_height : mazemap.height;

  var half    = Math.floor(MINIMAP_VIEW / 2);
  var tiles_x = Math.min(MINIMAP_VIEW, map_w);
  var tiles_y = Math.min(MINIMAP_VIEW, map_h);

  // Global player position — works whether in corridor or room.
  var gpos    = minimap_global_player_pos();

  // Top-left tile of the viewport, centered on the player and clamped to map bounds.
  var start_x = Math.max(0, Math.min(gpos.x - half, map_w - tiles_x));
  var start_y = Math.max(0, Math.min(gpos.y - half, map_h - tiles_y));

  var left_x = MINIMAP_MARGIN_LEFT;
  var top_y  = MINIMAP_MARGIN_TOP;

  fog_update();

  // Black background for the entire minimap area.
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    left_x * SCALE,
    top_y  * SCALE,
    tiles_x * MINIMAP_TILE_PX * SCALE,
    tiles_y * MINIMAP_TILE_PX * SCALE
  );

  // render map tiles from the merged dungeon grid
  for (var i = 0; i < tiles_x; i++) {
    var draw_x = i * MINIMAP_TILE_PX + left_x;
    for (var j = 0; j < tiles_y; j++) {
      var gx = start_x + i, gy = start_y + j;

      // Skip tiles the player has never seen.
      if (fog.discovered && !fog.discovered[gy][gx]) continue;

      var draw_y      = j * MINIMAP_TILE_PX + top_y;
      var target_tile = minimap_get_tile(gx, gy);
      if (tileset.walkable[target_tile]) {
        minimap_render_icon(draw_x, draw_y, MINIMAP_ICON_WALKABLE);
      } else if (target_tile != 0) {
        minimap_render_icon(draw_x, draw_y, MINIMAP_ICON_NONWALKABLE);
      }
    }
  }

  // render shops on the current map (only when in the corridor)
  if (avatar.map_id === 0) {
    for (var i = 0; i < atlas.maps[0].shops.length; i++) {
      var sx = atlas.maps[0].shops[i].exit_x - start_x;
      var sy = atlas.maps[0].shops[i].exit_y - start_y;
      if (sx >= 0 && sx < tiles_x && sy >= 0 && sy < tiles_y) {
        minimap_render_icon(sx * MINIMAP_TILE_PX + left_x, sy * MINIMAP_TILE_PX + top_y, MINIMAP_ICON_EXIT);
      }
    }
  }

  // render avatar cursor
  var cursor_direction;
  if      (avatar.facing == "west")  cursor_direction = MINIMAP_CURSOR_WEST;
  else if (avatar.facing == "north") cursor_direction = MINIMAP_CURSOR_NORTH;
  else if (avatar.facing == "east")  cursor_direction = MINIMAP_CURSOR_EAST;
  else                               cursor_direction = MINIMAP_CURSOR_SOUTH;
  var cur_x = (gpos.x - start_x) * MINIMAP_TILE_PX + left_x;
  var cur_y = (gpos.y - start_y) * MINIMAP_TILE_PX + top_y;
  minimap_render_cursor(cur_x, cur_y, cursor_direction);

}

function minimap_render_icon(screen_x, screen_y, icon_type) {
  ctx.drawImage(
    minimap.img,
    icon_type * MINIMAP_ICON_SIZE * PRESCALE,
    0,
    MINIMAP_ICON_SIZE * PRESCALE,
    MINIMAP_ICON_SIZE * PRESCALE,
    screen_x * SCALE,
    screen_y * SCALE,
    MINIMAP_TILE_PX * SCALE,
    MINIMAP_TILE_PX * SCALE
  );
}

function minimap_render_cursor(screen_x, screen_y, cursor_dir) {
  ctx.drawImage(
    minimap.cursor,
    cursor_dir * MINIMAP_ICON_SIZE * PRESCALE,
    0,
    MINIMAP_ICON_SIZE * PRESCALE,
    MINIMAP_ICON_SIZE * PRESCALE,
    screen_x * SCALE,
    screen_y * SCALE,
    MINIMAP_TILE_PX * SCALE,
    MINIMAP_TILE_PX * SCALE
  );
}



