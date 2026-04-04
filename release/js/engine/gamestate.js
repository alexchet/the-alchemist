/**
 Primary game state switcher
 
 */
 
const STATE_EXPLORE = 0;
const STATE_COMBAT  = 1;
const STATE_INFO    = 2;
const STATE_DIALOG  = 3;
const STATE_TITLE   = 4;

let gamestate = STATE_TITLE;

function gamestate_logic() {

  switch(gamestate) {
    case STATE_EXPLORE:
	  explore_logic();
	  break;
	case STATE_INFO:
	  info_logic();
	  break;
	case STATE_COMBAT:
	  combat_logic();
	  break;
    case STATE_DIALOG:
      dialog_logic();
      break;
	case STATE_TITLE:
	  title_logic();
	  break;
  } 
}

function gamestate_render() {

  bitfont_determinecolor();

  switch(gamestate) {
    case STATE_EXPLORE:
	  explore_render();
	  break;
	case STATE_INFO:
	  info_render();
	  break;
	case STATE_COMBAT:
	  combat_render();
	  break;
    case STATE_DIALOG:
      dialog_render();
      break;
	case STATE_TITLE:
	  title_render();
	  break;
  }
}

