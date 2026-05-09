const KEY = 'turtlegame_save';

export class SaveSystem {
  constructor(name) {
    const existing = this._load();
    if (existing && existing.name === name) {
      Object.assign(this, existing);
    } else {
      this.name = name;
      this.day = 1;
      this.foodsEaten = 0;
      this.foodsEatenToday = 0;
      this.growthStage = 0; // 0=hatchling, 1=juvenile, 2=youngadult
      this.burrowLevel = 0; // 0=starter,1=small,2=medium,3=large
      this.friendsMovedin = []; // animal ids
      this.hunger = 5;
      this.energy = 5;
      this.turtlePos = { x: 0, y: 0, z: 0 };
      this.turtleRotY = 0;
    }
  }

  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this));
    } catch {}
  }
}
