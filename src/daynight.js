import * as THREE from 'three';

// One in-game day = 10 real minutes = 600 seconds
const DAY_DURATION = 600;

const SKY_COLORS = [
  { t: 0.0,  sky: 0x0a0520, amb: 0x5555aa }, // midnight
  { t: 0.2,  sky: 0xff6b35, amb: 0xff9966 }, // dawn
  { t: 0.27, sky: 0x78c8f0, amb: 0xffe8c0 }, // morning
  { t: 0.5,  sky: 0x1aaaff, amb: 0xffffff }, // noon — deep vivid blue
  { t: 0.75, sky: 0xff8822, amb: 0xffc060 }, // dusk — richer orange
  { t: 0.85, sky: 0x1a1035, amb: 0x6655aa }, // twilight
  { t: 1.0,  sky: 0x0a0520, amb: 0x5555aa }, // midnight again
];

function lerpHex(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

function skyAt(t) {
  for (let i = 0; i < SKY_COLORS.length - 1; i++) {
    const a = SKY_COLORS[i], b = SKY_COLORS[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return { sky: lerpHex(a.sky, b.sky, f), amb: lerpHex(a.amb, b.amb, f) };
    }
  }
  return SKY_COLORS[0];
}

export class DayNight {
  constructor(scene, save) {
    this.scene = scene;
    this.save = save;
    this.elapsed = save.dayElapsed ?? (DAY_DURATION * 0.27); // default to morning on fresh save
    this.dayFraction = 0; // 0–1 through day

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(this.ambientLight);

    // Fill light — sky blue from above, warm tan from below. Never fully off.
    this.hemi = new THREE.HemisphereLight(0x5588ff, 0xcc9030, 0.45);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff4d6, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 0.1;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.camera.left = -50;
    this.sun.shadow.camera.right = 50;
    this.sun.shadow.camera.top = 50;
    this.sun.shadow.camera.bottom = -50;
    scene.add(this.sun);

    this.rainAmount = 0; // written each frame by RainSystem
    this._apply();
  }

  get isNight() { return this.dayFraction < 0.18 || this.dayFraction > 0.82; }
  get isEvening() { return this.dayFraction > 0.65 && !this.isNight; }

  // normalized 0–1 of how "sunny" it is for basking
  get baskingEfficiency() {
    const f = this.dayFraction;
    if (f < 0.25 || f > 0.78) return 0;
    return Math.min(1, Math.sin((f - 0.25) / 0.53 * Math.PI));
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= DAY_DURATION) this.elapsed -= DAY_DURATION;
    this.dayFraction = this.elapsed / DAY_DURATION;
    this.save.dayElapsed = this.elapsed;
    this._apply();
    this._updateDayInfo();
  }

  _apply() {
    const f = this.dayFraction;
    let { sky, amb } = skyAt(f);

    // Blend toward overcast gray when raining
    const rain = Math.max(0, Math.min(1, this.rainAmount));
    if (rain > 0) {
      sky = lerpHex(sky, 0x6888aa, rain * 0.55);
      amb = lerpHex(amb, 0x8899bb, rain * 0.40);
    }

    this.scene.background = new THREE.Color(sky);
    this.scene.fog.color.setHex(sky);
    this.ambientLight.color.setHex(amb);

    // Sun arc: rises east (x+), sets west (x-)
    const angle = f * Math.PI * 2 - Math.PI / 2;
    this.sun.position.set(Math.cos(angle) * 60, Math.sin(angle) * 60, 30);
    this.sun.intensity = Math.max(0, Math.sin(f * Math.PI)) * 1.8;

    // Hemisphere: full brightness midday, low floor at night so shadows stay deep
    const dayStrength = Math.max(0, Math.sin(f * Math.PI));
    this.hemi.intensity = 0.08 + dayStrength * 0.55;
  }

  _updateDayInfo() {
    const el = document.getElementById('dayinfo');
    if (!el) return;
    const hour = Math.floor(this.dayFraction * 24);
    const icon = this.isNight ? '🌙' : this.isEvening ? '🌅' : '☀️';
    el.textContent = `Day ${this.save.day}  ${icon}  ${hour}:00`;
  }

  // Advance to next morning (called on sleep)
  advanceDay() {
    this.elapsed = DAY_DURATION * 0.25; // wake up at ~6am
    this.dayFraction = 0.25;
    this.save.day++;
    this.save.dayElapsed = this.elapsed;
  }
}
