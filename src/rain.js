import * as THREE from 'three';

const DROP_COUNT       = 260;
const SPAWN_W          = 84;
const RAIN_INTERVAL_MIN = 70;
const RAIN_INTERVAL_MAX = 140;
const RAIN_DURATION_MIN = 40;
const RAIN_DURATION_MAX = 75;

export class RainSystem {
  constructor(scene, dayNight, animals) {
    this._scene    = scene;
    this._dayNight = dayNight;
    this._animals  = animals;

    this._raining   = false;
    this._nextIn    = RAIN_INTERVAL_MIN + Math.random() * (RAIN_INTERVAL_MAX - RAIN_INTERVAL_MIN);
    this._elapsed   = 0;
    this._duration  = 0;
    this._fadingOut = false;

    this._rainMesh   = null;
    this._rainSpeeds = null;
    this._puddles    = []; // [{ mesh, opacity, target }]

    // Exposed so DayNight can read it for sky tinting
    this.rainAmount = 0;
  }

  get isRaining() { return this._raining; }

  // ── Private ─────────────────────────────────────────────────────────────────

  _start() {
    this._raining   = true;
    this._fadingOut = false;
    this._elapsed   = 0;
    this._duration  = RAIN_DURATION_MIN + Math.random() * (RAIN_DURATION_MAX - RAIN_DURATION_MIN);

    // Rain streaks — LineSegments so each drop is a short vertical segment
    const pos    = new Float32Array(DROP_COUNT * 6);
    const speeds = new Float32Array(DROP_COUNT);
    for (let i = 0; i < DROP_COUNT; i++) {
      const x      = (Math.random() - 0.5) * SPAWN_W;
      const y      = Math.random() * 18;
      const z      = (Math.random() - 0.5) * SPAWN_W;
      const streak = 0.32 + Math.random() * 0.22;
      pos[i * 6]     = x;  pos[i * 6 + 1] = y;          pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x;  pos[i * 6 + 4] = y - streak; pos[i * 6 + 5] = z;
      speeds[i] = 9 + Math.random() * 7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._rainMesh = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.42 })
    );
    this._rainSpeeds = speeds;
    this._scene.add(this._rainMesh);

    // Puddles scattered across the world
    for (let i = 0; i < 8; i++) {
      const r    = 0.5 + Math.random() * 1.1;
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(r, 9),
        new THREE.MeshLambertMaterial({ color: 0x7aaabb, transparent: true, opacity: 0 })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((Math.random() - 0.5) * 55, 0.02, (Math.random() - 0.5) * 55);
      this._scene.add(mesh);
      this._puddles.push({ mesh, opacity: 0, target: 0.38 });
    }

    this._animals?.notifyRainStart?.();
    import('./ui.js').then(m => m.showMessage("🌧️ It's raining! The frogs love it!", 3000));
  }

  _stop() {
    this._raining   = false;
    this._fadingOut = true;
    this._nextIn    = RAIN_INTERVAL_MIN + Math.random() * (RAIN_INTERVAL_MAX - RAIN_INTERVAL_MIN);

    if (this._rainMesh) {
      this._scene.remove(this._rainMesh);
      this._rainMesh.geometry.dispose();
      this._rainMesh = null;
    }
    this._puddles.forEach(p => { p.target = 0; });
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(dt, turtle) {
    if (this._dayNight.isNight) {
      if (this._raining) this._stop();
    } else if (!this._raining && !this._fadingOut) {
      this._nextIn -= dt;
      if (this._nextIn <= 0) this._start();
    }

    // Animate falling streaks — follow turtle so the field always covers them
    if (this._rainMesh && turtle) {
      const pos = this._rainMesh.geometry.attributes.position.array;
      const tx = turtle.position.x;
      const tz = turtle.position.z;
      for (let i = 0; i < DROP_COUNT; i++) {
        const spd = this._rainSpeeds[i];
        pos[i * 6 + 1] -= spd * dt;
        pos[i * 6 + 4] -= spd * dt;
        if (pos[i * 6 + 4] < 0) {
          const streak = pos[i * 6 + 1] - pos[i * 6 + 4];
          const nx = tx + (Math.random() - 0.5) * SPAWN_W;
          const ny = 17 + Math.random() * 4;
          const nz = tz + (Math.random() - 0.5) * SPAWN_W;
          pos[i * 6]     = nx; pos[i * 6 + 1] = ny;           pos[i * 6 + 2] = nz;
          pos[i * 6 + 3] = nx; pos[i * 6 + 4] = ny - streak;  pos[i * 6 + 5] = nz;
        }
      }
      this._rainMesh.geometry.attributes.position.needsUpdate = true;
    }

    if (this._raining) {
      this._elapsed += dt;
      if (this._elapsed >= this._duration) this._stop();
    }

    // Smooth sky-darkening value (read by DayNight._apply)
    const rainTarget = this._raining ? 1 : 0;
    this.rainAmount += (rainTarget - this.rainAmount) * Math.min(1, dt * 1.2);

    // Fade puddles in / out
    let anyVisible = false;
    this._puddles.forEach(p => {
      p.opacity += (p.target - p.opacity) * Math.min(1, dt * 1.4);
      p.mesh.material.opacity = Math.max(0, p.opacity);
      if (p.opacity > 0.005) anyVisible = true;
    });

    if (this._fadingOut && !anyVisible) {
      this._puddles.forEach(p => this._scene.remove(p.mesh));
      this._puddles    = [];
      this._fadingOut  = false;
    }
  }
}
