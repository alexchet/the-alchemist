/**
 Exploration game state
 
 */

var explore = new Object();
explore.encounter_chance = 0;
explore.encounter_increment = .00;
explore.encounter_max = .30;
explore.message = "";

// found items for rendering
explore.treasure_id = 0;
explore.gold_value = 0;

// auto-explore
explore.auto       = false;
explore.auto_timer = 0;
explore.auto_steps = 0;
var AUTO_STEP_DELAY = 7;  // frames between steps (~8.5 steps/sec at 60 FPS)

// ---------------------------------------------------------------- auto-explore --

function auto_face_toward(dx, dy) {
  if      (dx ===  1) avatar.facing = "east";
  else if (dx === -1) avatar.facing = "west";
  else if (dy === -1) avatar.facing = "north";
  else if (dy ===  1) avatar.facing = "south";
}

function auto_local_to_global(lx, ly) {
  if (mazemap.current_id === 0 || !atlas.rooms) return { gx: lx, gy: ly };
  var room = atlas.rooms[mazemap.current_id - 1];
  return { gx: room.x + (lx - 1), gy: room.y + (ly - 1) };
}

// Look up which map a door tile at (lx, ly) leads to on the current map.
function auto_get_door_dest(lx, ly) {
  var exits = atlas.maps[mazemap.current_id].exits;
  for (var i = 0; i < exits.length; i++) {
    if (exits[i].exit_x === lx && exits[i].exit_y === ly) return exits[i].dest_map;
  }
  return -1;
}

// Check whether a destination map has any walkable tile not yet fog-discovered.
function auto_dest_has_undiscovered(dest_map) {
  if (dest_map < 0 || !atlas.maps[dest_map]) return false;
  var map = atlas.maps[dest_map];
  for (var ly = 0; ly < map.height; ly++) {
    for (var lx = 0; lx < map.width; lx++) {
      var t = map.tiles[ly][lx];
      if (!tileset.walkable[t] || t === 3) continue;
      var gx, gy;
      if (dest_map === 0) {
        gx = lx; gy = ly;
      } else {
        if (!atlas.rooms || !atlas.rooms[dest_map - 1]) continue;
        var room = atlas.rooms[dest_map - 1];
        gx = room.x + (lx - 1);
        gy = room.y + (ly - 1);
      }
      if (gx >= 0 && gy >= 0 && gx < atlas.minimap_width && gy < atlas.minimap_height) {
        if (!fog.discovered[gy] || !fog.discovered[gy][gx]) return true;
      }
    }
  }
  return false;
}

function auto_all_discovered() {
  fog_ensure_init();
  if (!fog.discovered || !atlas.minimap_grid) return false;
  for (var gy = 0; gy < atlas.minimap_height; gy++) {
    for (var gx = 0; gx < atlas.minimap_width; gx++) {
      var t = atlas.minimap_grid[gy][gx];
      if (tileset.walkable[t] && t !== 3 && !fog.discovered[gy][gx]) return false;
    }
  }
  return true;
}

function auto_find_next_step() {
  fog_ensure_init();
  if (!fog.discovered) return null;

  var w = atlas.maps[mazemap.current_id].width;
  var h = atlas.maps[mazemap.current_id].height;
  var sx = avatar.x, sy = avatar.y;
  var dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
  var in_corridor = (mazemap.current_id === 0);

  var vis = [];
  for (var vy = 0; vy < h; vy++) {
    vis[vy] = [];
    for (var vx = 0; vx < w; vx++) vis[vy][vx] = false;
  }
  vis[sy][sx] = true;

  var queue = [];
  for (var d = 0; d < dirs.length; d++) {
    var nx = sx + dirs[d].dx, ny = sy + dirs[d].dy;
    if (mazemap_bounds_check(nx, ny) && tileset.walkable[mazemap_get_tile(nx, ny)] && !vis[ny][nx]) {
      vis[ny][nx] = true;
      queue.push({ x: nx, y: ny, fdx: dirs[d].dx, fdy: dirs[d].dy });
    }
  }

  // room_exit_step: only used when inside a room with no more undiscovered tiles
  var room_exit_step = null;
  var qi = 0;
  while (qi < queue.length) {
    var cur = queue[qi++];
    var tile = mazemap_get_tile(cur.x, cur.y);

    if (tile === 3) {
      if (in_corridor) {
        // In corridor: enter room only if it has undiscovered tiles.
        var dest = auto_get_door_dest(cur.x, cur.y);
        if (dest !== -1 && auto_dest_has_undiscovered(dest)) {
          return { dx: cur.fdx, dy: cur.fdy };
        }
        // Room already explored — skip this door entirely to prevent re-entry loops.
      } else {
        // In room: save as exit fallback, only used once room is fully explored.
        if (!room_exit_step) room_exit_step = { dx: cur.fdx, dy: cur.fdy };
      }
      continue; // never expand past a door
    }

    // Regular walkable tile: return direction if undiscovered.
    var g = auto_local_to_global(cur.x, cur.y);
    if (g.gx >= 0 && g.gy >= 0 && g.gx < atlas.minimap_width && g.gy < atlas.minimap_height) {
      if (!fog.discovered[g.gy] || !fog.discovered[g.gy][g.gx]) {
        return { dx: cur.fdx, dy: cur.fdy };
      }
    }

    for (var d = 0; d < dirs.length; d++) {
      var nx = cur.x + dirs[d].dx, ny = cur.y + dirs[d].dy;
      if (mazemap_bounds_check(nx, ny) && tileset.walkable[mazemap_get_tile(nx, ny)] && !vis[ny][nx]) {
        vis[ny][nx] = true;
        queue.push({ x: nx, y: ny, fdx: cur.fdx, fdy: cur.fdy });
      }
    }
  }

  // In corridor: null means all reachable tiles and rooms explored — auto_all_discovered() will stop us.
  // In room: return exit door to get back to the corridor.
  return room_exit_step;
}

// ---------------------------------------------------------------- end auto-explore --

/**
 * Exploration
 * The hero's basic movement happens here
 * Also most other game states trigger from here
 * and completed states usually return here.
 */
function explore_logic() {
  explore.message = "";

  avatar_explore();

  // cancel auto on manual directional input
  if (explore.auto && (pressing.up || pressing.down || pressing.left || pressing.right)) {
    explore.auto = false;
    explore.auto_timer = 0;
    redraw = true;
  }

  // toggle auto on Tab
  if (pressing.tab && !input_lock.tab) {
    input_lock.tab = true;
    explore.auto = !explore.auto;
    explore.auto_timer = 0;
    if (explore.auto) explore.auto_steps = 0;
    redraw = true;
  }

  // auto-step tick
  if (explore.auto && !avatar.moved) {
    if (auto_all_discovered()) {
      explore.auto = false;
      explore.message = "Explored in " + explore.auto_steps + " steps";
      redraw = true;
    } else if (explore.auto_timer > 0) {
      explore.auto_timer--;
    } else {
      var step = auto_find_next_step();
      if (step === null) {
        explore.auto = false;
        redraw = true;
      } else {
        auto_face_toward(step.dx, step.dy);
        avatar_move(step.dx, step.dy);
        explore.auto_steps++;
        explore.auto_timer = AUTO_STEP_DELAY;
      }
    }
  }

  // check map exit
  if (avatar.moved) {
    if (mazemap_check_exit()) {
	
	  // display the name of the new map
	  explore.message = atlas.maps[mazemap.current_id].name;
	  
	  // don't allow a random encounter when switching maps
      avatar_save();
	  return;
	}
  }  
  
  // check shop
  if (avatar.moved) {
    if (mazemap_check_shop()) {
      explore.auto = false;
      gamestate = STATE_DIALOG;
      redraw = true;
      avatar_save();
      return;
    }
  }

  // check special script;
  if (avatar.moved) {
    if (mapscript_exec(mazemap.current_id)) {
      avatar_save();
      return;
    }
  }

  // check random encounter
  var enemy_options = atlas.maps[mazemap.current_id].enemies.length;
  if (avatar.moved && enemy_options > 0) {

    if (Math.random() < explore.encounter_chance) {
      explore.encounter_chance = 0.0;
      explore.auto = false;
      gamestate = STATE_COMBAT;
      action.select_pos = BUTTON_POS_ATTACK;
      combat.timer = COMBAT_INTRO_DELAY;
	  combat.phase = COMBAT_PHASE_INTRO;

      // choose an enemy randomly from the list for this map
      var enemy_roll = Math.floor(Math.random() * enemy_options);
      var enemy_id = atlas.maps[mazemap.current_id].enemies[enemy_roll];
	  combat_set_enemy(enemy_id);

      return;
    }
    else {
      explore.encounter_chance += explore.encounter_increment;
      explore.encounter_chance = Math.min(explore.encounter_chance, explore.encounter_max);
    }
  }
  
  // check opening info screen (keyboard)
  if (pressing.action && !input_lock.action) {
    gamestate = STATE_INFO;
	input_lock.action = true;
	redraw = true;
    action.select_pos = BUTTON_POS_INFO;
	info_clear_messages();
    sounds_play(SFX_CLICK);
    return;
  }
  
  // check opening info screen (mouse)
  if (pressing.mouse && !input_lock.mouse && isWithin(mouse_pos, BUTTON_POS_INFO)) {
    gamestate = STATE_INFO;
	input_lock.mouse = true;
	redraw = true;
    action.select_pos = BUTTON_POS_INFO;
	info_clear_messages();
	sounds_play(SFX_CLICK);
    return;
  }

}


function explore_render() {

  tileset_background();
  mazemap_render(avatar.x, avatar.y, avatar.facing);

  // HUD elements
  // direction
  bitfont_render(avatar.facing, 80, 2, JUSTIFY_CENTER);
  
  info_render_button();

  if (explore.auto) {
    bitfont_render(explore.auto_steps + " steps", 158, 2, JUSTIFY_RIGHT);
  }

  if (OPTIONS.minimap) {
    minimap_render();
  }
    
  // if there is treasure to display, put the message higher
  if (explore.gold_value > 0 || explore.treasure_id > 0) {
    bitfont_render(explore.message, 80, 70, JUSTIFY_CENTER);  
  }
  else {
    bitfont_render(explore.message, 80, 100, JUSTIFY_CENTER);    
  }
  
  // if a map event has rewarded gold to the player
  // display it on the ground here
  if (explore.gold_value > 0) {
    treasure_render_gold(explore.gold_value);
    explore.gold_value = 0;    
  }
  
  // display treasure on the ground
  if (explore.treasure_id > 0) {
    treasure_render_item(explore.treasure_id);
    explore.treasure_id = 0;
  }
}
