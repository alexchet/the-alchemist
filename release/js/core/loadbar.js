/**
  Loading progress bar
 
  Simple rectangular loading bar centered on the screen.
  It doesn't know anything about the rest of the project 
  (e.g. how many assets you're trying to load).
  It just takes in a percentage and draws the bar.
  
 */

const loadbar = {
  width:            100,
  height:           10,
  background_color: '#333333',
  foreground_color: '#cccccc',
  // VIEW_WIDTH and VIEW_HEIGHT must already be defined (config.js)
  x: VIEW_WIDTH/2  - 50,
  y: VIEW_HEIGHT/2 - 5,
};

function loadbar_render(percentage) {
  loadbar_render_bar(100, loadbar.background_color);
  loadbar_render_bar(percentage, loadbar.foreground_color);
}

function loadbar_render_bar(percentage, bar_color) {
  var load_size = (percentage * 100) / loadbar.width;
  ctx.beginPath();
  ctx.rect(loadbar.x*SCALE, loadbar.y*SCALE, load_size*SCALE, loadbar.height*SCALE);
  ctx.fillStyle = bar_color;
  ctx.fill();
  ctx.closePath();
}
