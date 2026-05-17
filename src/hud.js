const GROWTH_GOALS = [30, 80, 160, 280, 420, null];
const GROWTH_NAMES = ['Hatchling', 'Small Turtle', 'Juvenile', 'Young Adult', 'Adult', 'Elder Tortoise'];

export class HUD {
  constructor(save) {
    this.save = save;
    this._hunger = document.getElementById('hunger');
    this._energy = document.getElementById('energy');

    this._hunger.insertAdjacentHTML('beforebegin',
      '<div id="hungerLabel" style="position:absolute;top:48px;left:16px;font-size:13px;opacity:0.75;color:#fff8e1;text-shadow:0 1px 3px rgba(0,0,0,0.7);">Hunger — eat food to fill</div>'
    );
    this._energy.insertAdjacentHTML('beforebegin',
      '<div id="energyLabel" style="position:absolute;top:48px;right:16px;font-size:13px;opacity:0.75;color:#fff8e1;text-shadow:0 1px 3px rgba(0,0,0,0.7);text-align:right;">Energy — bask in sun to fill</div>'
    );

    // Growth bar — top center
    this._growthEl = document.createElement('div');
    this._growthEl.style.cssText = `
      position:absolute; top:14px; left:50%; transform:translateX(-50%);
      color:#fff8e1; font-size:13px; text-align:center; white-space:nowrap;
      text-shadow:0 1px 3px rgba(0,0,0,0.7); pointer-events:none;
      background:rgba(0,0,0,0.32); border-radius:12px; padding:5px 14px;
    `;
    document.getElementById('hud').appendChild(this._growthEl);
  }

  update() {
    const s = this.save;
    this._hunger.innerHTML = this._icons(s.hunger, 5, '🍃');
    this._energy.innerHTML = this._icons(s.energy, 5, '☀️');

    const hungerLabel = document.getElementById('hungerLabel');
    const energyLabel = document.getElementById('energyLabel');
    if (hungerLabel) hungerLabel.style.color = s.hunger <= 1.5 ? '#ff8866' : '#fff8e1';
    if (energyLabel) energyLabel.style.color = s.energy <= 1.5 ? '#ff8866' : '#fff8e1';

    // Growth bar
    const stage = s.growthStage;
    const goal  = GROWTH_GOALS[stage];
    if (goal) {
      const pct    = Math.min(1, s.foodsEaten / goal);
      const filled = Math.round(pct * 8);
      const bar    = '█'.repeat(filled) + '░'.repeat(8 - filled);
      this._growthEl.innerHTML =
        `🐢 ${GROWTH_NAMES[stage]} &nbsp;[${bar}]&nbsp; ${Math.min(s.foodsEaten, goal)}/${goal} foods to grow`;
    } else {
      this._growthEl.textContent = `🐢 ${GROWTH_NAMES[stage]} · Fully Grown! ✨`;
    }
  }

  flashStat(stat) {
    const el = stat === 'hunger' ? this._hunger : this._energy;
    if (!el) return;
    el.classList.remove('stat-hit');
    // Force reflow so re-adding the class restarts the animation
    void el.offsetWidth;
    el.classList.add('stat-hit');
    setTimeout(() => el.classList.remove('stat-hit'), 750);
  }

  // Each icon slot is the same emoji at one of three opacities:
  //   full  (value ≥ 0.66 of that slot) → 1.0
  //   partial (0.2–0.66)                → 0.35  (visibly faded, clearly the same shape)
  //   empty (< 0.2)                     → 0.12  (ghosted outline hint)
  _icons(value, total, emoji) {
    let html = '';
    for (let i = 0; i < total; i++) {
      const fill = Math.min(1, Math.max(0, value - i));
      const opacity = fill >= 0.66 ? 1.0 : fill >= 0.2 ? 0.35 : 0.12;
      html += `<span style="opacity:${opacity};display:inline-block;">${emoji}</span>`;
    }
    return html;
  }
}
