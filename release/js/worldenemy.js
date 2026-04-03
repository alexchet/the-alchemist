/**
 * worldenemy.js
 * World-space enemy placement, AI, and in-world combat resolution.
 *
 * Each enemy has: map_id, x, y (current local position),
 *                 home_map, home_x, home_y (spawn position),
 *                 type, hp, state, patrol_timer.
 *
 * Per-step AI fires once per player action (move, attack, or spell).
 * Pathfinding uses BFS on atlas.minimap_grid (global coordinates).
 * Enemies can follow the player through doors by reading atlas exit data.
 */

var WE_IDLE  = 0;
var WE_ALERT = 1;
var WE_DEAD  = 2;

var WE_DETECT_RADIUS = 6;   // BFS steps within which an idle enemy detects the player
var WE_GIVE_UP_SQ    = 20 * 20; // squared euclidean distance at which alert enemy gives up
var WE_PATROL_DELAY  = 3;   // player steps between patrol moves
var WE_PATROL_SQ     = 4 * 4;  // squared euclidean max-wander from home

var world_enemies = [];

// ------------------------------------------------------------------- init --

function we_init() {
  world_enemies = [];
  if (!atlas.rooms) return;
  // Skip rooms[0] (the start room — always safe).
  for (var r = 1; r < atlas.rooms.length; r++) {
    var map_id = r + 1;
    var map = atlas.maps[map_id];
    if (!map || !map.enemy_placement) continue;
    for (var j = 0; j < map.enemy_placement.length; j++) {
      var ep = map.enemy_placement[j];
      world_enemies.push({
        map_id:       map_id,
        x:            ep.x,
        y:            ep.y,
        home_map:     map_id,
        home_x:       ep.x,
        home_y:       ep.y,
        type:         ep.type,
        hp:           enemy.stats[ep.type].hp,
        state:        WE_IDLE,
        patrol_timer: Math.floor(Math.random() * WE_PATROL_DELAY),
      });
    }
  }
}

// ------------------------------------------------------------ coordinates --

function we_to_global(map_id, lx, ly) {
  if (map_id === 0 || !atlas.rooms) return { x: lx, y: ly };
  var room = atlas.rooms[map_id - 1];
  return { x: room.x + (lx - 1), y: room.y + (ly - 1) };
}

function we_dist_sq(ax, ay, bx, by) {
  var dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

// True if the local tile (map_id, lx, ly) is occupied by the player or a living enemy.
function we_tile_occupied(map_id, lx, ly) {
  if (avatar.map_id === map_id && avatar.x === lx && avatar.y === ly) return true;
  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;
    if (e.map_id === map_id && e.x === lx && e.y === ly) return true;
  }
  return false;
}

// Is a global tile passable for enemy movement?
function we_passable(gx, gy) {
  if (!atlas.minimap_grid) return false;
  if (gx < 0 || gy < 0 || gx >= atlas.minimap_width || gy >= atlas.minimap_height) return false;
  var t = atlas.minimap_grid[gy][gx];
  return t === 1 || t === 3 || t === 5; // FLOOR, DOOR, CEIL
}

// Local (same-map) squared distance between enemy and player.
// Returns Infinity if they are on different maps.
function we_local_dist_sq(e) {
  if (e.map_id !== avatar.map_id) return Infinity;
  var dx = e.x - avatar.x, dy = e.y - avatar.y;
  return dx * dx + dy * dy;
}

// BFS: return the first global {dx,dy} step from (gx,gy) toward (tx,ty).
function we_bfs_step_toward(gx, gy, tx, ty) {
  if (gx === tx && gy === ty) return null;
  var DIRS = [[0,-1],[0,1],[-1,0],[1,0]];
  var vis = {}, queue = [], qi = 0;
  vis[gx + ',' + gy] = true;
  for (var d = 0; d < 4; d++) {
    var nx = gx + DIRS[d][0], ny = gy + DIRS[d][1];
    if (!we_passable(nx, ny)) continue;
    var key = nx + ',' + ny;
    if (vis[key]) continue;
    vis[key] = true;
    if (nx === tx && ny === ty) return {dx: DIRS[d][0], dy: DIRS[d][1]};
    queue.push({x:nx, y:ny, fdx:DIRS[d][0], fdy:DIRS[d][1]});
  }
  while (qi < queue.length) {
    var cur = queue[qi++];
    for (var d = 0; d < 4; d++) {
      var nx = cur.x + DIRS[d][0], ny = cur.y + DIRS[d][1];
      if (!we_passable(nx, ny)) continue;
      var key = nx + ',' + ny;
      if (vis[key]) continue;
      vis[key] = true;
      if (nx === tx && ny === ty) return {dx: cur.fdx, dy: cur.fdy};
      queue.push({x:nx, y:ny, fdx:cur.fdx, fdy:cur.fdy});
    }
  }
  return null;
}

// Move enemy one global step, crossing doors via exit data when needed.
// Uses the current map's tile array for door detection — not minimap_grid,
// which has the corridor-side door positions, not the room-side border doors.
function we_move_enemy(e, gdx, gdy) {
  var map = atlas.maps[e.map_id];
  if (!map) return;

  // Convert global direction to local target coords on the current map.
  var tx, ty;
  if (e.map_id === 0) {
    tx = e.x + gdx;
    ty = e.y + gdy;
  } else {
    var g    = we_to_global(e.map_id, e.x, e.y);
    var room = atlas.rooms[e.map_id - 1];
    tx = g.x + gdx - room.x + 1;
    ty = g.y + gdy - room.y + 1;
  }

  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return;

  var target_tile = map.tiles[ty][tx];

  if (target_tile === 3) { // DOOR — look up exit and teleport
    var exits = map.exits;
    for (var i = 0; i < exits.length; i++) {
      if (exits[i].exit_x === tx && exits[i].exit_y === ty) {
        if (!we_tile_occupied(exits[i].dest_map, exits[i].dest_x, exits[i].dest_y)) {
          e.map_id = exits[i].dest_map;
          e.x      = exits[i].dest_x;
          e.y      = exits[i].dest_y;
        }
        return;
      }
    }
    return; // door with no matching exit
  }

  if (tileset.walkable[target_tile] && !we_tile_occupied(e.map_id, tx, ty)) {
    e.x = tx;
    e.y = ty;
  }
}

// --------------------------------------------------------------- queries --

function we_get_front_enemy() {
  var fx = avatar.x, fy = avatar.y;
  if      (avatar.facing === 'north') fy--;
  else if (avatar.facing === 'south') fy++;
  else if (avatar.facing === 'west')  fx--;
  else                                fx++;
  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;
    if (e.map_id === avatar.map_id && e.x === fx && e.y === fy) return e;
  }
  return null;
}

// Returns {enemy, dist} for the nearest enemy in the forward line of sight
// (up to 3 tiles). Stops at walls or doors. Returns null if none visible.
function we_get_forward_enemy() {
  var dx = 0, dy = 0;
  if      (avatar.facing === 'north') dy = -1;
  else if (avatar.facing === 'south') dy =  1;
  else if (avatar.facing === 'west')  dx = -1;
  else                                dx =  1;

  for (var dist = 1; dist <= 3; dist++) {
    var tx = avatar.x + dx * dist;
    var ty = avatar.y + dy * dist;
    var tile = mazemap_get_tile(tx, ty);

    if (!tileset.walkable[tile]) return null; // wall blocks LOS

    for (var i = 0; i < world_enemies.length; i++) {
      var e = world_enemies[i];
      if (e.state === WE_DEAD) continue;
      if (e.map_id === avatar.map_id && e.x === tx && e.y === ty) {
        return { enemy: e, dist: dist };
      }
    }

    if (tile === 3) return null; // door blocks further sight
  }
  return null;
}

// Render an enemy sprite scaled by distance (dist 1=full, 2=half, 3=quarter).
function we_render_enemy_at_dist(enemy_id, dist) {
  if (!enemy.img_loaded) return;
  var w, h, ox, oy;
  if      (dist === 1) { w = 160; h = 120; ox = 0;  oy = 0;  }
  else if (dist === 2) { w = 80;  h = 60;  ox = 40; oy = 30; }
  else                 { w = 40;  h = 30;  ox = 60; oy = 45; }
  ctx.drawImage(
    enemy.img[enemy_id],
    0,             0,
    160 * PRESCALE, 120 * PRESCALE,
    ox * SCALE,    oy * SCALE,
    w  * SCALE,    h  * SCALE
  );
}

function we_get_adjacent_enemies() {
  var result = [];
  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;
    if (e.map_id !== avatar.map_id) continue;
    var dx = e.x - avatar.x, dy = e.y - avatar.y;
    if (dx * dx + dy * dy === 1) result.push(e);
  }
  return result;
}

// True if any living enemy can detect the player (for auto-explore stop).
function we_any_detected() {
  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;
    if (we_local_dist_sq(e) <= WE_DETECT_RADIUS * WE_DETECT_RADIUS) return true;
  }
  return false;
}

// --------------------------------------------------------- player actions --

// Attack the enemy directly in front. Returns true if an action was taken.
function we_player_attack() {
  var target = we_get_front_enemy();
  if (!target) {
    explore.combat_action = "(No target)";
    explore.combat_result = "";
    return false;
  }
  we_resolve_hero_attack(target);
  return true;
}

// Burn — hits all adjacent enemies. Returns true if an action was taken.
function we_player_burn() {
  if (avatar.mp === 0) {
    explore.combat_action = "(No MP)";
    explore.combat_result = "";
    return false;
  }
  var targets = we_get_adjacent_enemies();
  if (targets.length === 0) {
    explore.combat_action = "(No targets)";
    explore.combat_result = "";
    return false;
  }
  avatar.mp--;
  sounds_play(SFX_FIRE);
  var total = 0;
  for (var i = 0; i < targets.length; i++) {
    var dmg = we_burn_damage(targets[i].type);
    targets[i].hp -= dmg;
    total += dmg;
    if (targets[i].hp <= 0) we_kill_enemy(targets[i]);
  }
  explore.combat_action = "Burn!";
  explore.combat_result = total + " damage";
  return true;
}

function we_burn_damage(enemy_type) {
  var w    = info.weapons[avatar.weapon];
  var min  = w.atk_min + avatar.bonus_atk;
  var max  = w.atk_max + avatar.bonus_atk;
  var dmg  = Math.round(Math.random() * (max - min)) + min;
  var cat  = enemy.stats[enemy_type].category;
  if      (cat === ENEMY_CATEGORY_UNDEAD) dmg += max + max;
  else if (cat !== ENEMY_CATEGORY_DEMON)  dmg += max;
  return dmg;
}

function we_resolve_hero_attack(target) {
  if (Math.random() < 0.20) {
    explore.combat_action = "Attack!";
    explore.combat_result = "Miss!";
    sounds_play(SFX_MISS);
    return;
  }
  var w   = info.weapons[avatar.weapon];
  var min = w.atk_min + avatar.bonus_atk;
  var max = w.atk_max + avatar.bonus_atk;
  var dmg = Math.round(Math.random() * (max - min)) + min;
  if (Math.random() < 0.10) {
    dmg += max;
    explore.combat_action = "Critical!";
    sounds_play(SFX_CRITICAL);
  } else {
    explore.combat_action = "Attack!";
    sounds_play(SFX_ATTACK);
  }
  target.hp -= dmg;
  explore.combat_result = dmg + " damage";
  if (target.hp <= 0) we_kill_enemy(target);
}

function we_kill_enemy(e) {
  e.state = WE_DEAD;
  var gmin = enemy.stats[e.type].gold_min;
  var gmax = enemy.stats[e.type].gold_max;
  var gold = Math.round(Math.random() * (gmax - gmin)) + gmin;
  avatar.gold += gold;
  explore.kill_message = enemy.stats[e.type].name + " defeated!  +" + gold + " gold";
  explore.kill_timer   = 90;
  sounds_play(SFX_COIN);
}

// --------------------------------------------------------------- enemy AI --

// Called once per player action.
function we_step() {
  var pg = we_to_global(avatar.map_id, avatar.x, avatar.y);

  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;

    var eg  = we_to_global(e.map_id, e.x, e.y);
    var dsq = we_dist_sq(eg.x, eg.y, pg.x, pg.y);

    if (e.state === WE_IDLE) {
      if (we_local_dist_sq(e) <= WE_DETECT_RADIUS * WE_DETECT_RADIUS) {
        e.state = WE_ALERT;
      }
      if (e.state === WE_IDLE) { we_patrol(e); continue; }
    }

    // ALERT
    if (dsq > WE_GIVE_UP_SQ) {
      e.state = WE_IDLE;
      e.patrol_timer = 0;
      continue;
    }

    if (e.map_id === avatar.map_id) {
      var ddx = e.x - avatar.x, ddy = e.y - avatar.y;
      if (ddx * ddx + ddy * ddy === 1) {
        we_enemy_attack(e);
        continue;
      }
    }

    var step = we_bfs_step_toward(eg.x, eg.y, pg.x, pg.y);
    if (step) we_move_enemy(e, step.dx, step.dy);
  }
}

function we_patrol(e) {
  e.patrol_timer = (e.patrol_timer || 0) + 1;
  if (e.patrol_timer < WE_PATROL_DELAY) return;
  e.patrol_timer = 0;

  var DIRS = [[0,-1],[0,1],[-1,0],[1,0]];
  // Fisher-Yates shuffle.
  for (var i = 3; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = DIRS[i]; DIRS[i] = DIRS[j]; DIRS[j] = tmp;
  }

  var map   = atlas.maps[e.map_id];
  var hg    = we_to_global(e.home_map, e.home_x, e.home_y);

  for (var d = 0; d < 4; d++) {
    var nx = e.x + DIRS[d][0], ny = e.y + DIRS[d][1];
    if (!map || nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    var t = map.tiles[ny][nx];
    if (!tileset.walkable[t] || t === 3) continue; // don't roam through doors
    var ng = we_to_global(e.map_id, nx, ny);
    if (we_dist_sq(ng.x, ng.y, hg.x, hg.y) > WE_PATROL_SQ) continue;
    if (we_tile_occupied(e.map_id, nx, ny)) continue;
    e.x = nx; e.y = ny;
    break;
  }
}

function we_enemy_attack(e) {
  var powers = enemy.stats[e.type].powers;
  var power  = powers[Math.floor(Math.random() * powers.length)];
  explore.enemy_name = enemy.stats[e.type].name;
  switch (power) {
    case ENEMY_POWER_ATTACK:  we_do_enemy_attack(e);  break;
    case ENEMY_POWER_SCORCH:  we_do_enemy_scorch(e);  break;
    case ENEMY_POWER_HPDRAIN: we_do_enemy_hpdrain(e); break;
    case ENEMY_POWER_MPDRAIN: we_do_enemy_mpdrain(e); break;
  }
  redraw = true;
  if (avatar.hp <= 0) {
    avatar.hp = 0;
    explore.defeated = true;
    sounds_play(SFX_DEFEAT);
    avatar_save();
  }
}

function we_do_enemy_attack(e) {
  explore.enemy_action = "Attacks!";
  if (Math.random() < 0.30) { explore.enemy_result = "Miss!"; sounds_play(SFX_MISS); return; }
  var min = enemy.stats[e.type].atk_min, max = enemy.stats[e.type].atk_max;
  var dmg = Math.round(Math.random() * (max - min)) + min;
  if (Math.random() < 0.05) { dmg += min; explore.enemy_action = "Critical!"; sounds_play(SFX_CRITICAL); }
  else sounds_play(SFX_ATTACK);
  dmg -= info.armors[avatar.armor].def;
  if (dmg < 1) dmg = 1;
  avatar.hp -= dmg;
  explore.enemy_result = "-" + dmg + " HP";
}

function we_do_enemy_scorch(e) {
  explore.enemy_action = "Scorch!";
  if (Math.random() < 0.30) { explore.enemy_result = "Miss!"; sounds_play(SFX_MISS); return; }
  sounds_play(SFX_FIRE);
  var min = enemy.stats[e.type].atk_min, max = enemy.stats[e.type].atk_max;
  var dmg = Math.round(Math.random() * (max - min)) + min + min;
  dmg -= info.armors[avatar.armor].def;
  if (dmg < 1) dmg = 1;
  avatar.hp -= dmg;
  explore.enemy_result = "-" + dmg + " HP";
}

function we_do_enemy_hpdrain(e) {
  explore.enemy_action = "HP Drain!";
  if (Math.random() < 0.30) { explore.enemy_result = "Miss!"; sounds_play(SFX_MISS); return; }
  sounds_play(SFX_HPDRAIN);
  var min = enemy.stats[e.type].atk_min, max = enemy.stats[e.type].atk_max;
  var dmg = Math.round(Math.random() * (max - min)) + min;
  dmg -= info.armors[avatar.armor].def;
  if (dmg < 1) dmg = 1;
  avatar.hp -= dmg;
  explore.enemy_result = "-" + dmg + " HP";
}

function we_do_enemy_mpdrain(e) {
  explore.enemy_action = "MP Drain!";
  if (Math.random() < 0.30) { explore.enemy_result = "Miss!"; sounds_play(SFX_MISS); return; }
  sounds_play(SFX_MPDRAIN);
  if (avatar.mp > 0) { avatar.mp--; explore.enemy_result = "-1 MP"; }
  else explore.enemy_result = "No effect";
}

// ------------------------------------------------------------ respawn --

function we_respawn_all() {
  for (var i = 0; i < world_enemies.length; i++) {
    var e   = world_enemies[i];
    e.state        = WE_IDLE;
    e.map_id       = e.home_map;
    e.x            = e.home_x;
    e.y            = e.home_y;
    e.hp           = enemy.stats[e.type].hp;
    e.patrol_timer = Math.floor(Math.random() * WE_PATROL_DELAY);
  }
}

// ------------------------------------------------------------ minimap --

// Called from minimap_render() with the viewport bounds already computed.
function we_render_minimap(start_x, start_y, tiles_x, tiles_y) {
  if (!atlas.rooms) return;
  for (var i = 0; i < world_enemies.length; i++) {
    var e = world_enemies[i];
    if (e.state === WE_DEAD) continue;
    var eg = we_to_global(e.map_id, e.x, e.y);
    if (fog.discovered && (!fog.discovered[eg.y] || !fog.discovered[eg.y][eg.x])) continue;
    var sx = eg.x - start_x, sy = eg.y - start_y;
    if (sx < 0 || sy < 0 || sx >= tiles_x || sy >= tiles_y) continue;
    ctx.fillStyle = (e.state === WE_ALERT) ? "#ff4444" : "#ff9944";
    ctx.fillRect(
      (MINIMAP_MARGIN_LEFT + sx * MINIMAP_TILE_PX) * SCALE,
      (MINIMAP_MARGIN_TOP  + sy * MINIMAP_TILE_PX) * SCALE,
      MINIMAP_TILE_PX * SCALE,
      MINIMAP_TILE_PX * SCALE
    );
  }
}
