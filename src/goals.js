const POND_X = -20, POND_Z = -22;

const GOAL_POOL = [
  {
    id: 'eat',
    label: t => `Eat ${t} foods`,
    makeTarget: () => 4 + Math.floor(Math.random() * 3),
    progress: (save, _turtle, _state) => Math.min(save.foodsEatenToday || 0, 99),
  },
  {
    id: 'bask',
    label: () => 'Bask in the sun ☀️',
    makeTarget: () => 1,
    progress: (_save, turtle, state) => {
      if (turtle.isBasking) state.basked = true;
      return state.basked ? 1 : 0;
    },
  },
  {
    id: 'explore',
    label: () => 'Explore far from home',
    makeTarget: () => 1,
    progress: (_save, turtle, state) => {
      if (turtle.distanceTo(0, 0) > 24) state.explored = true;
      return state.explored ? 1 : 0;
    },
  },
  {
    id: 'pond',
    label: () => 'Visit the pond 💧',
    makeTarget: () => 1,
    progress: (_save, turtle, state) => {
      const dx = turtle.position.x - POND_X;
      const dz = turtle.position.z - POND_Z;
      if (Math.sqrt(dx * dx + dz * dz) < 12) state.visitedPond = true;
      return state.visitedPond ? 1 : 0;
    },
  },
  {
    id: 'dig',
    label: () => 'Dig in your burrow ⛏️',
    makeTarget: () => 1,
    progress: (_save, _turtle, state) => state.dug ? 1 : 0,
  },
];

export class GoalSystem {
  constructor(save, turtle, audio) {
    this._save   = save;
    this._turtle = turtle;
    this._audio  = audio;
    this._day    = save.day;
    this._state  = {};
    this._rewarded = false;
    this._goals  = this._pick();
    this._el     = this._makeEl();
  }

  // Called by Burrow after a successful dig
  notifyDig() { this._state.dug = true; }

  _pick() {
    // Always include eat, then pick 2 more at random
    const pool = GOAL_POOL.filter(g => g.id !== 'eat').sort(() => Math.random() - 0.5).slice(0, 2);
    return [GOAL_POOL[0], ...pool].map(def => ({
      def,
      target: def.makeTarget(),
      state: {},
    }));
  }

  _makeEl() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; bottom:28px; right:20px; z-index:20;
      color:#fff8e1; font-family:inherit; font-size:14px;
      background:rgba(0,0,0,0.42); border-radius:14px;
      padding:10px 14px; pointer-events:none; min-width:190px;
      text-shadow:0 1px 3px rgba(0,0,0,0.7); line-height:1.8;
    `;
    document.body.appendChild(el);
    return el;
  }

  update(dt) {
    // New day — reset
    if (this._save.day !== this._day) {
      this._day = this._save.day;
      this._goals = this._pick();
      this._state = {};
      this._rewarded = false;
    }

    let allDone = true;
    const lines = [`<b>📋 Day ${this._day} Goals</b>`];

    this._goals.forEach(g => {
      const prog = g.def.progress(this._save, this._turtle, this._state);
      const done = prog >= g.target;
      if (!done) allDone = false;
      const check = done ? '✅' : '☐';
      const label = g.def.label(g.target);
      const extra = g.target > 1 ? ` (${Math.min(prog, g.target)}/${g.target})` : '';
      lines.push(`${check} ${label}${extra}`);
    });

    if (allDone && !this._rewarded) {
      this._rewarded = true;
      this._reward();
    }

    if (allDone) {
      lines.push(`<span style="color:#f4c460">⭐ All done!</span>`);
    }

    this._el.innerHTML = lines.join('<br>');
  }

  _reward() {
    this._save.energy = Math.min(5, this._save.energy + 1);
    this._audio?.play('grow');
    import('./ui.js').then(m =>
      m.showMessage('⭐ All daily goals complete! Bonus energy! ✨', 3500)
    );
  }
}
