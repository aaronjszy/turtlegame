const POND_X = -20;
const POND_Z = -22;
const POND_EDGE_R = 8.5;
const DRINK_ZONE  = 0.5;   // distance from edge to trigger
const DRINK_WAIT  = 2.2;   // seconds standing still
const DRINK_HUNGER = 0.8;
const DRINK_COOLDOWN = 10;

export class PondSystem {
  constructor(turtle, save, audio) {
    this._turtle = turtle;
    this._save   = save;
    this._audio  = audio;
    this._stillTime = 0;
    this._cooldown  = 0;
    this._hintEl    = this._makeHint();
  }

  _makeHint() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
      background:rgba(0,30,80,0.6); color:#b8e4ff; padding:8px 22px;
      border-radius:16px; font-size:18px; font-family:inherit;
      pointer-events:none; opacity:0; transition:opacity 0.3s; z-index:20;
    `;
    document.body.appendChild(el);
    return el;
  }

  update(dt) {
    if (this._turtle.isInBurrow) { this._hintEl.style.opacity = '0'; return; }

    this._cooldown = Math.max(0, this._cooldown - dt);

    const dx = this._turtle.position.x - POND_X;
    const dz = this._turtle.position.z - POND_Z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const nearEdge = dist > POND_EDGE_R - DRINK_ZONE && dist < POND_EDGE_R + DRINK_ZONE;

    if (nearEdge && this._cooldown === 0) {
      this._hintEl.textContent = '💧 Stand still to drink';
      this._hintEl.style.opacity = '1';

      if (!this._turtle.isMoving) {
        this._stillTime += dt;
        if (this._stillTime >= DRINK_WAIT) this._drink();
      } else {
        this._stillTime = 0;
      }
    } else {
      this._hintEl.style.opacity = '0';
      if (!nearEdge) this._stillTime = 0;
    }
  }

  _drink() {
    this._cooldown = DRINK_COOLDOWN;
    this._stillTime = 0;
    this._save.hunger = Math.min(5, this._save.hunger + DRINK_HUNGER);
    this._audio.play('eat');
    import('./ui.js').then(m => m.showMessage('💧 Cool pond water… refreshing!', 2500));
  }
}
