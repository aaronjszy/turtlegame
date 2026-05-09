let _save, _burrow, _animals, _dayNight, _audio, _food, _goals;

export function initOnboarding(save) {
  if (save.day !== 1 || save.shownOnboarding) return;
  save.shownOnboarding = true;

  const hints = [
    [1500,  'Use the arrow keys to walk around and explore! 🐢'],
    [9000,  'Find colorful food on the ground — walk over it to eat! 🍃'],
    [22000, 'Stand still on a golden sunny patch to recharge your energy ☀️'],
    [40000, 'Your burrow is at the center of the map — walk over the dark hole to go inside! 🏠'],
  ];
  hints.forEach(([delay, text]) => {
    setTimeout(() => { if (_save?.day === 1) showMessage(text, 4500); }, delay);
  });
}

export function initUI(save, burrow, animals, dayNight, audio, showMsg, showSummary, goals) {
  _save = save;
  _burrow = burrow;
  _animals = animals;
  _dayNight = dayNight;
  _audio = audio;
  _goals = goals;

  // Expose dayNight globally for raccoon/burrow access
  window._dayNight = dayNight;

  burrow.onSleepCallback = () => sleep(showMsg, showSummary);

  // Check growth stage each game tick (called from update loop via save changes)
  _checkGrowth = (sm) => checkGrowth(sm);
}

let _checkGrowth = null;

export function checkGrowth(showMsg) {
  if (!_save) return;
  const s = _save;
  let newStage = s.growthStage;
  if (s.growthStage < 1 && s.day >= 5 && s.foodsEaten >= 30) newStage = 1;
  if (s.growthStage < 2 && s.day >= 15 && s.foodsEaten >= 100) newStage = 2;

  if (newStage > s.growthStage) {
    s.growthStage = newStage;
    s.save();
    showMsg("You're growing up! ✨", 4000);
    _audio?.play('grow');
  }
}

let _messageTimeout = null;

export function showMessage(text, duration = 2500) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(_messageTimeout);
  _messageTimeout = setTimeout(() => { el.style.opacity = '0'; }, duration);
}

export function showDaySummary(save, food, animals, onDone) {
  const panel = document.getElementById('summary');
  const lines = document.getElementById('summaryLines');
  const okBtn = document.getElementById('summaryOk');

  const completedDay = save.day - 1;
  const foodToday = save.foodsEatenToday || 0;
  const stage = ['Hatchling', 'Juvenile', 'Young Adult'][save.growthStage];
  const friendCount = (save.friendsMovedin || []).length;

  // Update header and button
  const h2 = panel.querySelector('h2');
  if (h2) h2.textContent = `⭐ Day ${completedDay} complete!`;
  okBtn.textContent = `Good morning! ☀️`;

  lines.innerHTML = `
    <div>🍃 Foods eaten today: <b>${foodToday}</b></div>
    <div>🐢 Stage: <b>${stage}</b> (${save.foodsEaten} total foods)</div>
    <div>🏠 Friends in burrow: <b>${friendCount}</b></div>
    <div>📅 Day <b>${save.day}</b> is starting!</div>
  `;

  panel.style.display = 'flex';

  okBtn.onclick = () => {
    panel.style.display = 'none';
    if (onDone) onDone();
  };
}

function sleep(showMsg, showSummaryFn) {
  if (!_save || !_dayNight) return;

  // Phase 1 — fade to deep night sky
  const fade = document.createElement('div');
  fade.style.cssText = `
    position:fixed;inset:0;background:#0a0520;z-index:90;
    opacity:0;transition:opacity 1.2s;pointer-events:none;
    display:flex;align-items:center;justify-content:center;
    font-family:inherit;color:#fff8e1;font-size:28px;
  `;
  fade.textContent = '✨ Goodnight… ✨';
  document.body.appendChild(fade);

  setTimeout(() => { fade.style.opacity = '1'; }, 50);

  // Phase 2 — advance day, show summary over the dark screen
  setTimeout(() => {
    _dayNight.advanceDay();
    const friends = _save.friendsMovedin || [];
    _save.energy = Math.min(5, _save.energy + 2 + (friends.includes('cricket_frog') ? 1 : 0));
    const hungerDelta = friends.includes('gopher_frog') ? 0.5 : -0.5;
    _save.hunger = Math.max(0.5, Math.min(5, _save.hunger + hungerDelta));
    if (window._food) window._food.respawn();
    if (friends.includes('gopher_mouse') && window._food) {
      window._food.spawnNear(0, 2.5, 3);
    }
    checkGrowth(showMsg);
    _animals?.onBurrowUpgrade?.();
    _save.save();
    fade.textContent = '';

    showDaySummary(_save, null, _animals, () => {
      // Phase 3 — sunrise: swap to warm orange then fade out into the world
      fade.style.transition = 'background 0.8s, opacity 1.2s';
      fade.style.background = '#ff9944';
      setTimeout(() => {
        _burrow?.exitBurrow?.();
        fade.style.opacity = '0';
        setTimeout(() => {
          fade.remove();
          showMsg(`Good morning, ${_save.name}! Day ${_save.day} begins! 🌅`, 3500);
        }, 1200);
      }, 800);
    });
  }, 1500);
}
