import * as THREE from 'three';
import { ANIMALS } from './animals.js';

const BURROW_POS = { x: 0, z: 0 };
const AUTO_ENTER_RADIUS = 1.0;   // walk over the hole → auto-enter
const APPROACH_RADIUS  = 4.0;    // show hint label when this close
const DIG_ENERGY_COST    = 1.0;
const DIG_COOLDOWN       = 1.5;
const OUTSIDE_TIME_NEEDED = 40; // seconds outside required between digs

// Digs needed to reach next level
const DIGS_PER_LEVEL = [4, 8, 10];

export const BURROW_LEVELS = [
  { name: 'Starter', capacity: 1, holeScale: 1.0 },
  { name: 'Small',   capacity: 3, holeScale: 1.4 },
  { name: 'Medium',  capacity: 5, holeScale: 1.8 },
  { name: 'Large',   capacity: 7, holeScale: 2.2 },
];

function friendEmoji(id) {
  return { cricket_frog:'🐸', indigo_snake:'🐍', gopher_frog:'🐸',
           burrowing_owl:'🦉', armadillo:'🦔', scarlet_snake:'🐍', gopher_mouse:'🐭' }[id] ?? '🐾';
}
function friendName(id) {
  return { cricket_frog:'Cricket Frog', indigo_snake:'Indigo Snake',
           gopher_frog:'Gopher Frog', burrowing_owl:'Burrowing Owl',
           armadillo:'Armadillo', scarlet_snake:'Scarlet Snake', gopher_mouse:'Gopher Mouse' }[id] ?? id;
}

export class Burrow {
  constructor(scene, turtle, save, audio) {
    this.scene   = scene;
    this.turtle  = turtle;
    this.save    = save;
    this.audio   = audio;

    this._digCooldown = 0;
    this._outsideTime = OUTSIDE_TIME_NEEDED; // start ready to dig
    this._hintEl      = this._makeHint();

    this.onSleepCallback = null;

    // Grab the hole mesh from the scene so we can grow it on level-up
    this._holeMesh = null;
    scene.traverse(obj => {
      if (obj.isMesh && obj.geometry?.type === 'CircleGeometry'
          && Math.abs(obj.position.x) < 0.1 && Math.abs(obj.position.z) < 0.1) {
        this._holeMesh = obj;
      }
    });
    this._applyHoleScale();
  }

  get level()    { return this.save.burrowLevel || 0; }
  get capacity() { return BURROW_LEVELS[this.level].capacity; }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  _makeHint() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.55); color:#fff8e1; padding:8px 22px;
      border-radius:16px; font-size:18px; font-family:inherit;
      pointer-events:none; opacity:0; transition:opacity 0.25s; z-index:20;
    `;
    document.body.appendChild(el);
    return el;
  }

  showExclamation() {}

  // ── Update loop ────────────────────────────────────────────────────────────

  update(dt) {
    this._digCooldown = Math.max(0, this._digCooldown - dt);

    if (this.turtle.isInBurrow) return;

    this._outsideTime = Math.min(OUTSIDE_TIME_NEEDED, this._outsideTime + dt);

    const dist = this.turtle.distanceTo(BURROW_POS.x, BURROW_POS.z);

    // Show "walk over hole to enter" hint when approaching
    if (dist < APPROACH_RADIUS) {
      this._hintEl.textContent = '🏠 Walk into the hole to enter your burrow';
      this._hintEl.style.opacity = '1';
    } else {
      this._hintEl.style.opacity = '0';
    }

    // Auto-enter when turtle walks over the hole
    if (dist < AUTO_ENTER_RADIUS) {
      this._enterBurrow();
    }
  }

  // ── Enter / exit ───────────────────────────────────────────────────────────

  _enterBurrow() {
    this.turtle.isInBurrow = true;
    this.turtle.mesh.visible = false;
    this._hintEl.style.opacity = '0';
    this._showInterior();
  }

  exitBurrow() {
    this.turtle.isInBurrow = false;
    this.turtle.mesh.visible = true;
    // Move turtle just outside the hole so it doesn't immediately re-enter
    this.turtle.mesh.position.set(0, this.turtle.groundY, 2.6);
    this._hideInterior();
  }

  // ── Interior panel ─────────────────────────────────────────────────────────

  _showInterior() {
    let panel = document.getElementById('burrowPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'burrowPanel';
      panel.style.cssText = `
        position:fixed; inset:0; background:#1a0a00;
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; z-index:40; color:#fff8e1; font-family:inherit;
        overflow-y:auto;
      `;
      document.body.appendChild(panel);
    }

    const friends  = this.save.friendsMovedin || [];
    const level    = this.level;
    const lvlInfo  = BURROW_LEVELS[level];
    const progress = this.save.burrowProgress || 0;
    const maxDigs  = level < 3 ? DIGS_PER_LEVEL[level] : 0;
    const isNight  = window._dayNight?.isNight ?? false;
    const canDig   = level < 3;

    // Progress bar — frame it around what unlocks next
    const pct = canDig ? Math.round((progress / maxDigs) * 100) : 100;
    const nextFriends = canDig
      ? ANIMALS.filter(a => a.minLevel === level + 1).map(a => a.emoji).join('')
      : '';
    const progressHtml = canDig ? `
      <div style="margin-bottom:16px;width:90%;max-width:320px;">
        <div style="font-size:13px;opacity:0.7;margin-bottom:6px;text-align:center;">
          ⛏️ Dig to unlock ${nextFriends} ??? &nbsp;(${progress}/${maxDigs})
        </div>
        <div style="background:rgba(255,255,255,0.12);border-radius:8px;height:12px;overflow:hidden;">
          <div style="background:#f4c460;width:${pct}%;height:100%;border-radius:8px;transition:width 0.4s;"></div>
        </div>
      </div>` : `<div style="margin-bottom:16px;font-size:14px;opacity:0.7;">Fully expanded! 🎉</div>`;

    // Full collection grid — all 7 animals, silhouettes for locked/unmet ones
    const collectionHtml = ANIMALS.map(animal => {
      const movedIn  = friends.includes(animal.id);
      const eligible = level >= animal.minLevel && !movedIn;
      if (movedIn) {
        return `<div style="background:rgba(255,200,80,0.13);border-radius:12px;padding:10px 6px;text-align:center;border:1px solid rgba(255,200,80,0.3);">
          <div style="font-size:30px;">${animal.emoji}</div>
          <div style="font-size:11px;font-weight:bold;margin-top:4px;">${animal.name}</div>
          <div style="font-size:10px;color:#f4c460;margin-top:3px;line-height:1.3;">${animal.perkDesc}</div>
        </div>`;
      } else if (eligible) {
        return `<div style="background:rgba(0,0,0,0.28);border-radius:12px;padding:10px 6px;text-align:center;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:30px;filter:grayscale(1) brightness(0.28);">${animal.emoji}</div>
          <div style="font-size:11px;font-weight:bold;margin-top:4px;color:#666;">???</div>
          <div style="font-size:10px;color:#555;margin-top:3px;">Wander outside!</div>
        </div>`;
      } else {
        return `<div style="background:rgba(0,0,0,0.18);border-radius:12px;padding:10px 6px;text-align:center;border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:30px;filter:grayscale(1) brightness(0.1);">${animal.emoji}</div>
          <div style="font-size:11px;font-weight:bold;margin-top:4px;color:#333;">???</div>
          <div style="font-size:10px;color:#383838;margin-top:3px;">🔒 Dig more</div>
        </div>`;
      }
    }).join('');

    panel.innerHTML = `
      <h2 style="font-size:28px;margin-bottom:2px;">🏠 Your Burrow</h2>
      <p style="font-size:14px;opacity:0.55;margin-bottom:14px;">${lvlInfo.name} · ${friends.length}/${ANIMALS.length} friends collected</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:90%;max-width:380px;margin-bottom:16px;">
        ${collectionHtml}
      </div>

      ${progressHtml}

      <div id="burrowMsg" style="min-height:24px;font-size:15px;color:#f4c460;margin-bottom:8px;text-align:center;"></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        ${canDig ? `<button id="digBtn" style="font-family:inherit;font-size:20px;padding:11px 28px;border-radius:14px;border:none;background:#c4963c;color:#fff;cursor:pointer;font-weight:bold;">⛏️ Dig!</button>` : ''}
        ${isNight ? `<button id="sleepBtn" style="font-family:inherit;font-size:20px;padding:11px 28px;border-radius:14px;border:none;background:#5566cc;color:#fff;cursor:pointer;font-weight:bold;">😴 Sleep until morning</button>` : ''}
        <button id="exitBurrowBtn" style="font-family:inherit;font-size:20px;padding:11px 28px;border-radius:14px;border:none;background:#666;color:#fff;cursor:pointer;">🌿 Go outside</button>
      </div>
    `;

    panel.style.display = 'flex';

    document.getElementById('exitBurrowBtn')?.addEventListener('click', () => this.exitBurrow());
    document.getElementById('digBtn')?.addEventListener('click', () => this._dig());
    document.getElementById('sleepBtn')?.addEventListener('click', () => {
      this._hideInterior();
      this.onSleepCallback?.();
    });
  }

  _hideInterior() {
    const panel = document.getElementById('burrowPanel');
    if (panel) panel.style.display = 'none';
  }

  // Refresh the panel in place (after digging) without closing it
  _refreshInterior() {
    if (document.getElementById('burrowPanel')?.style.display !== 'none') {
      this._showInterior();
    }
  }

  _burrowMsg(text, duration = 2500) {
    const el = document.getElementById('burrowMsg');
    if (!el) return;
    el.textContent = text;
    clearTimeout(this._burrowMsgTimer);
    this._burrowMsgTimer = setTimeout(() => { el.textContent = ''; }, duration);
  }

  // ── Digging ────────────────────────────────────────────────────────────────

  showArrivalFanfare(animal) {
    if (!document.getElementById('fanfareStyle')) {
      const s = document.createElement('style');
      s.id = 'fanfareStyle';
      s.textContent = `@keyframes fanfarePop{from{transform:scale(0.3);opacity:0}60%{transform:scale(1.15)}to{transform:scale(1);opacity:1}}`;
      document.head.appendChild(s);
    }
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(10,5,0,0.92);z-index:80;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:inherit;color:#fff8e1;cursor:pointer;
    `;
    el.innerHTML = `
      <div style="font-size:88px;animation:fanfarePop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both;">${animal.emoji}</div>
      <div style="font-size:26px;font-weight:bold;margin-top:14px;">🎉 ${animal.name} moved in!</div>
      <div style="font-size:16px;margin-top:10px;color:#f4c460;padding:8px 22px;background:rgba(255,255,255,0.08);border-radius:12px;">✨ ${animal.perkDesc}</div>
      <div style="font-size:14px;margin-top:14px;opacity:0.55;font-style:italic;max-width:280px;text-align:center;">"${animal.invite}"</div>
      <div style="font-size:12px;margin-top:22px;opacity:0.35;">Tap anywhere to continue</div>
    `;
    document.body.appendChild(el);
    const dismiss = () => el.remove();
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 4500);
  }

  _dig() {
    if (this._digCooldown > 0) {
      this._burrowMsg(`Still digging... give it a moment! ⛏️`);
      return;
    }
    if (this._outsideTime < OUTSIDE_TIME_NEEDED) {
      const left = Math.ceil(OUTSIDE_TIME_NEEDED - this._outsideTime);
      this._burrowMsg(`Go explore outside first! 🌿 (${left}s)`);
      return;
    }
    if (this.save.energy <= DIG_ENERGY_COST) {
      this._burrowMsg(`Too tired to dig! Go bask in the sun first. ☀️`);
      return;
    }

    this._digCooldown = DIG_COOLDOWN;
    this._outsideTime = 0;
    this.save.energy = Math.max(0.5, this.save.energy - DIG_ENERGY_COST);
    this.onDigCallback?.();
    this.audio.play('dig');

    const hasArmadillo = (this.save.friendsMovedin || []).includes('armadillo');
    const gained = hasArmadillo ? 2 : 1;
    this.save.burrowProgress = (this.save.burrowProgress || 0) + gained;

    if (hasArmadillo) {
      this._burrowMsg('Armadillo helped — double progress! 🦔⛏️⛏️');
    }

    if (this.save.burrowProgress >= DIGS_PER_LEVEL[this.level]) {
      this._levelUp();
    } else {
      this._refreshInterior();
    }
  }

  _levelUp() {
    this.save.burrowLevel = (this.save.burrowLevel || 0) + 1;
    this.save.burrowProgress = 0;
    this.save.save();

    this._applyHoleScale();
    this._refreshInterior();

    import('./ui.js').then(m =>
      m.showMessage(`Your burrow is bigger now! 🏠 New friends can move in!`, 3500)
    );
  }

  _applyHoleScale() {
    if (!this._holeMesh) return;
    const s = BURROW_LEVELS[this.level].holeScale;
    this._holeMesh.scale.setScalar(s);
  }
}
