/**
 Sound effects
 */
 
const SFX_COUNT = 14;

const SFX_ATTACK    = 0;
const SFX_MISS      = 1;
const SFX_CRITICAL  = 2;
const SFX_HEAL      = 3;
const SFX_FIRE      = 4;
const SFX_COIN      = 5;
const SFX_HPDRAIN   = 6;
const SFX_MPDRAIN   = 7;
const SFX_RUN       = 8;
const SFX_BLOCKED   = 9;
const SFX_DEFEAT    = 10;
const SFX_BONESHIELD = 11;
const SFX_CLICK     = 12;
const SFX_UNLOCK    = 13;

const sounds = { fx: [] };

function sounds_init() {
  sounds.fx[SFX_ATTACK] = new Audio("sounds/attack.wav");
  sounds.fx[SFX_MISS] = new Audio("sounds/miss.wav");
  sounds.fx[SFX_CRITICAL] = new Audio("sounds/critical.wav");
  sounds.fx[SFX_HEAL] = new Audio("sounds/heal.wav");
  sounds.fx[SFX_FIRE] = new Audio("sounds/fire.wav");
  sounds.fx[SFX_COIN] = new Audio("sounds/coin.wav");
  sounds.fx[SFX_HPDRAIN] = new Audio("sounds/hpdrain.wav");
  sounds.fx[SFX_MPDRAIN] = new Audio("sounds/mpdrain.wav");
  sounds.fx[SFX_RUN] = new Audio("sounds/run.wav");
  sounds.fx[SFX_BLOCKED] = new Audio("sounds/blocked.wav");
  sounds.fx[SFX_DEFEAT] = new Audio("sounds/defeat.wav");
  sounds.fx[SFX_BONESHIELD] = new Audio("sounds/boneshield.wav");
  sounds.fx[SFX_CLICK] = new Audio("sounds/click.wav");
  sounds.fx[SFX_UNLOCK] = new Audio("sounds/unlock.wav");
  
}

function sounds_play(sfx_id) {
  if (OPTIONS.sfx == false) return;
 
  try {
    sounds.fx[sfx_id].currentTime = 0;
	sounds.fx[sfx_id].play();
  }
  catch(err) {
    // it's okay if sounds can't play.
	// TODO: change to "don't play if sound is not loaded yet" like images
  };
 
}
