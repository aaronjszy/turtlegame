const INDEX_KEY = 'turtlegame_saves';

function allSaveNames() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || []; } catch { return []; }
}

function registerName(name) {
  const names = allSaveNames();
  if (!names.includes(name)) {
    names.push(name);
    localStorage.setItem(INDEX_KEY, JSON.stringify(names));
  }
}

// Migrate old single-slot save to the new per-name format
function migrate() {
  const old = localStorage.getItem('turtlegame_save');
  if (!old) return;
  try {
    const data = JSON.parse(old);
    if (data?.name) {
      const newKey = `turtlegame_save_${data.name}`;
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, old);
        registerName(data.name);
      }
    }
  } catch {}
  localStorage.removeItem('turtlegame_save');
}

migrate();

export function getSaveList() {
  return allSaveNames().map(name => {
    try {
      const raw = localStorage.getItem(`turtlegame_save_${name}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }).filter(Boolean);
}

export function exportSave(name) {
  const raw = localStorage.getItem(`turtlegame_save_${name}`);
  if (!raw) return;
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (!data?.name) throw new Error('invalid save');
    localStorage.setItem(`turtlegame_save_${data.name}`, jsonText);
    registerName(data.name);
    return data.name;
  } catch { return null; }
}

export function deleteSave(name) {
  localStorage.removeItem(`turtlegame_save_${name}`);
  const names = allSaveNames().filter(n => n !== name);
  localStorage.setItem(INDEX_KEY, JSON.stringify(names));
}

export class SaveSystem {
  constructor(name) {
    Object.defineProperty(this, '_key', {
      value: `turtlegame_save_${name}`,
      enumerable: false,
    });
    const existing = this._load();
    if (existing) {
      Object.assign(this, existing);
    } else {
      this.name = name;
      this.day = 1;
      this.foodsEaten = 0;
      this.foodsEatenToday = 0;
      this.growthStage = 0;
      this.burrowLevel = 0;
      this.friendsMovedin = [];
      this.hunger = 5;
      this.energy = 5;
      this.turtlePos = { x: 0, y: 0, z: 0 };
      this.turtleRotY = 0;
    }
    registerName(name);
  }

  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  save() {
    try { localStorage.setItem(this._key, JSON.stringify(this)); } catch {}
  }
}
