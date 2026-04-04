/**
 Exploration game state
 */

const AUTO_STEP_DELAY = 7; // frames between steps (~8.5 steps/sec at 60 FPS)

const explore = {
  message:        "",
  treasure_id:    0,
  gold_value:     0,
  auto:           false,
  auto_timer:     0,
  auto_steps:     0,
  combat_action:  "",
  combat_result:  "",
  enemy_name:     "",
  enemy_action:   "",
  enemy_result:   "",
  kill_message:   "",
  kill_timer:     0,
  msg_timer:      0,
  defeated:       false,
};

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

function auto_get_door_dest(lx, ly) {
  var exits = atlas.maps[mazemap.current_id].exits;
  for (var i = 0; i < exits.length; i++) {
    if (exits[i].exit_x === lx && exits[i].exit_y === ly) return exits[i].dest_map;
  }
  return -1;
}

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

  var room_exit_step = null;
  var qi = 0;
  while (qi < queue.length) {
    var cur = queue[qi++];
    var tile = mazemap_get_tile(cur.x, cur.y);

    if (tile === 3) {
      if (in_corridor) {
        var dest = auto_get_door_dest(cur.x, cur.y);
        if (dest !== -1 && auto_dest_has_undiscovered(dest)) {
          return { dx: cur.fdx, dy: cur.fdy };
        }
      } else {
        if (!room_exit_step) room_exit_step = { dx: cur.fdx, dy: cur.fdy };
      }
      continue;
    }

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

  return room_exit_step;
}

// ---------------------------------------------------------------- end auto-explore --

function explore_clear_combat_messages() {
  explore.combat_action = "";
  explore.combat_result = "";
  explore.enemy_name    = "";
  explore.enemy_action  = "";
  explore.enemy_result  = "";
}

/**
 * Exploration logic
 */
function explore_logic() {
  explore.message = "";
  var player_acted = false;

  // --- Defeat state: wait for action press then respawn ---
  if (explore.defeated) {
    if ((pressing.action && !input_lock.action) || (pressing.mouse && !input_lock.mouse)) {
      input_lock.action = true;
      input_lock.mouse  = true;
      explore.defeated  = false;
      explore_clear_combat_messages();
      explore.kill_message = "";
      explore.kill_timer   = 0;
      explore.msg_timer    = 0;
      we_respawn_all();
      avatar_respawn();
      redraw = true;
    }
    return;
  }

  // --- Tick message timers ---
  if (explore.kill_timer > 0) explore.kill_timer--;
  if (explore.msg_timer > 0) {
    explore.msg_timer--;
    if (explore.msg_timer === 0) explore_clear_combat_messages();
  }

  // --- Stop auto-explore when enemy enters detection range ---
  if (explore.auto && we_any_detected()) {
    explore.auto = false;
    explore.message = "Enemy nearby!";
    redraw = true;
  }

  // --- Cancel auto on manual directional input ---
  if (explore.auto && (pressing.up || pressing.down || pressing.left || pressing.right)) {
    explore.auto = false;
    explore.auto_timer = 0;
    redraw = true;
  }

  // --- Toggle auto on Tab ---
  if (pressing.tab && !input_lock.tab) {
    input_lock.tab = true;
    explore.auto = !explore.auto;
    explore.auto_timer = 0;
    if (explore.auto) explore.auto_steps = 0;
    redraw = true;
  }

  // --- Player combat actions FIRST — locks mouse before avatar_explore sees it ---
  // (clickarea_right covers x:120-160 which overlaps all action buttons)
  if (action_checkuse(BUTTON_POS_ATTACK)) {
    if (we_player_attack()) player_acted = true;
    explore.msg_timer = 90;
    redraw = true;
  }
  else if (action_checkuse(BUTTON_POS_HEAL) && avatar.spellbook >= 1 && avatar.mp > 0 && avatar.hp < avatar.max_hp) {
    var heal_amount = Math.floor(avatar.max_hp / 2) + Math.floor(Math.random() * avatar.max_hp / 2);
    avatar.hp = Math.min(avatar.hp + heal_amount, avatar.max_hp);
    avatar.mp--;
    sounds_play(SFX_HEAL);
    explore.combat_action = "Heal!";
    explore.combat_result = "+" + heal_amount + " HP";
    explore.msg_timer = 90;
    player_acted = true;
    redraw = true;
    avatar_save();
  }
  else if (action_checkuse(BUTTON_POS_BURN) && avatar.spellbook >= 2) {
    if (we_player_burn()) player_acted = true;
    explore.msg_timer = 90;
    redraw = true;
  }

  // --- Player movement / turning (resets avatar.moved to false first) ---
  avatar_explore();
  if (avatar.moved) player_acted = true;

  // --- Auto-step tick (only if player didn't already move manually) ---
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
        if (avatar.moved) player_acted = true;
      }
    }
  }

  // --- Map exit ---
  if (avatar.moved) {
    if (mazemap_check_exit()) {
      explore.message = atlas.maps[mazemap.current_id].name;
      avatar_save();
      return;
    }
  }

  // --- Shop ---
  if (avatar.moved) {
    if (mazemap_check_shop()) {
      explore.auto = false;
      gamestate = STATE_DIALOG;
      redraw = true;
      avatar_save();
      return;
    }
  }

  // --- Map script ---
  if (avatar.moved) {
    if (mapscript_exec(mazemap.current_id)) {
      avatar_save();
      return;
    }
  }

  // --- Enemy AI step (fires after any player action) ---
  if (player_acted) {
    we_step();
    redraw = true;
    avatar_save();
  }

  // --- Info screen ---
  if (pressing.action && !input_lock.action) {
    gamestate = STATE_INFO;
    input_lock.action = true;
    redraw = true;
    action.select_pos = BUTTON_POS_INFO;
    info_clear_messages();
    sounds_play(SFX_CLICK);
    return;
  }

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

  // Render enemy sprite if one is visible ahead (up to 3 tiles, LOS blocked by walls/doors)
  var forward = we_get_forward_enemy();
  if (forward !== null) {
    we_render_enemy_at_dist(forward.enemy.type, forward.dist);
    bitfont_render(enemy.stats[forward.enemy.type].name, 80, 2, JUSTIFY_CENTER);
  } else {
    bitfont_render(avatar.facing, 80, 2, JUSTIFY_CENTER);
  }

  info_render_button();
  action_render();
  info_render_hpmp();

  if (explore.auto) {
    bitfont_render(explore.auto_steps + " steps", 158, 2, JUSTIFY_RIGHT);
  }

  if (OPTIONS.minimap) {
    minimap_render();
  }

  // Kill message
  if (explore.kill_timer > 0) {
    bitfont_render(explore.kill_message, 80, 90, JUSTIFY_CENTER);
  }

  // Player combat messages (top-left)
  if (explore.combat_action !== "") {
    bitfont_render("You: " + explore.combat_action, 2, 20, JUSTIFY_LEFT);
    if (explore.combat_result !== "") bitfont_render(explore.combat_result, 2, 30, JUSTIFY_LEFT);
  }

  // Enemy combat messages (top-left, below player's)
  if (explore.enemy_name !== "") {
    bitfont_render(explore.enemy_name + ": " + explore.enemy_action, 2, 45, JUSTIFY_LEFT);
    if (explore.enemy_result !== "") bitfont_render(explore.enemy_result, 2, 55, JUSTIFY_LEFT);
  }

  // Map / explore message
  if (explore.gold_value > 0 || explore.treasure_id > 0) {
    bitfont_render(explore.message, 80, 70, JUSTIFY_CENTER);
  } else {
    bitfont_render(explore.message, 80, 100, JUSTIFY_CENTER);
  }

  if (explore.gold_value > 0) {
    treasure_render_gold(explore.gold_value);
    explore.gold_value = 0;
  }
  if (explore.treasure_id > 0) {
    treasure_render_item(explore.treasure_id);
    explore.treasure_id = 0;
  }

  // Defeat overlay
  if (explore.defeated) {
    bitfont_render("You are defeated...", 80, 60, JUSTIFY_CENTER);
    bitfont_render("Press action to respawn", 80, 75, JUSTIFY_CENTER);
  }
}
