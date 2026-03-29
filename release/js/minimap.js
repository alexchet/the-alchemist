/**
 * Minimap
 * Shown in the Info screen
 */

var MINIMAP_ICON_SIZE = 3; // pixels — source sprite size (do not change)
var MINIMAP_TILE_PX   = 2; // pixels — rendered size per tile on screen
 
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


var MINIMAP_VIEW = 15; // viewport size in tiles

function minimap_render() {

  var half    = Math.floor(MINIMAP_VIEW / 2);
  var tiles_x = Math.min(MINIMAP_VIEW, mazemap.width);
  var tiles_y = Math.min(MINIMAP_VIEW, mazemap.height);

  // Top-left tile of the viewport, centered on the avatar and clamped to map bounds.
  var start_x = Math.max(0, Math.min(avatar.x - half, mazemap.width  - tiles_x));
  var start_y = Math.max(0, Math.min(avatar.y - half, mazemap.height - tiles_y));

  var left_x = MINIMAP_MARGIN_LEFT;
  var top_y  = MINIMAP_MARGIN_TOP;

  // render map tiles
  for (var i = 0; i < tiles_x; i++) {
    var draw_x = i * MINIMAP_TILE_PX + left_x;
    for (var j = 0; j < tiles_y; j++) {
      var draw_y      = j * MINIMAP_TILE_PX + top_y;
      var target_tile = mazemap_get_tile(start_x + i, start_y + j);
      if (tileset.walkable[target_tile]) {
        minimap_render_icon(draw_x, draw_y, MINIMAP_ICON_WALKABLE);
      } else if (target_tile != 0) {
        minimap_render_icon(draw_x, draw_y, MINIMAP_ICON_NONWALKABLE);
      }
    }
  }

  // render exits (only those inside the viewport)
  for (var i = 0; i < atlas.maps[mazemap.current_id].exits.length; i++) {
    var ex = atlas.maps[mazemap.current_id].exits[i].exit_x - start_x;
    var ey = atlas.maps[mazemap.current_id].exits[i].exit_y - start_y;
    if (ex >= 0 && ex < tiles_x && ey >= 0 && ey < tiles_y) {
      minimap_render_icon(ex * MINIMAP_TILE_PX + left_x, ey * MINIMAP_TILE_PX + top_y, MINIMAP_ICON_EXIT);
    }
  }

  // render shops (only those inside the viewport)
  for (var i = 0; i < atlas.maps[mazemap.current_id].shops.length; i++) {
    var sx = atlas.maps[mazemap.current_id].shops[i].exit_x - start_x;
    var sy = atlas.maps[mazemap.current_id].shops[i].exit_y - start_y;
    if (sx >= 0 && sx < tiles_x && sy >= 0 && sy < tiles_y) {
      minimap_render_icon(sx * MINIMAP_TILE_PX + left_x, sy * MINIMAP_TILE_PX + top_y, MINIMAP_ICON_EXIT);
    }
  }

  // render avatar cursor
  var cursor_direction;
  if      (avatar.facing == "west")  cursor_direction = MINIMAP_CURSOR_WEST;
  else if (avatar.facing == "north") cursor_direction = MINIMAP_CURSOR_NORTH;
  else if (avatar.facing == "east")  cursor_direction = MINIMAP_CURSOR_EAST;
  else                               cursor_direction = MINIMAP_CURSOR_SOUTH;
  var cur_x = (avatar.x - start_x) * MINIMAP_TILE_PX + left_x;
  var cur_y = (avatar.y - start_y) * MINIMAP_TILE_PX + top_y;
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



