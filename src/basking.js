import * as THREE from 'three';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

const BASK_SPOTS = [
  { x: 10, z: 28, r: 7 }, // Sandy Clearing (south)
  { x: -8, z: 15, r: 4 }, // Open meadow (west)
  { x: 20, z: -10, r: 4 }, // Near berry patch (northeast)
];

const BASK_RADIUS = 4;
const BASK_WAIT = 1.5;   // seconds standing still before basking kicks in
const ENERGY_RATE = 0.65; // per second at peak efficiency

export class BaskingSystem {
  constructor(scene, turtle, save, dayNight, audio) {
    this.scene = scene;
    this.turtle = turtle;
    this.save = save;
    this.dayNight = dayNight;
    this.audio = audio;

    this._stillTime = 0;
    this._isBasking = false;
    this._lowEnergyHintCooldown = 0;

    this._spots = BASK_SPOTS.map(s => this._makeSpot(s));
  }

  _makeSpot({ x, z, r }) {
    const geo = new THREE.CircleGeometry(r, 12);
    const mat = flat(0xf5d97a);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.06, z);
    mesh.material.transparent = true;
    mesh.material.opacity = 0.55;
    this.scene.add(mesh);
    return { x, z, r, mesh };
  }

  _inSpot() {
    const tx = this.turtle.position.x;
    const tz = this.turtle.position.z;
    for (const s of this._spots) {
      const dx = tx - s.x, dz = tz - s.z;
      if (dx * dx + dz * dz < s.r * s.r) return true;
    }
    return false;
  }

  update(dt) {
    if (this.turtle.isInBurrow || this.turtle.inShell) {
      this._stillTime = 0;
      this._isBasking = false;
      this.turtle.isBasking = false;
      return;
    }

    this._lowEnergyHintCooldown = Math.max(0, this._lowEnergyHintCooldown - dt);

    // Glow spots based on sun height
    const eff = this.dayNight.baskingEfficiency;
    this._spots.forEach(s => { s.mesh.material.opacity = 0.3 + eff * 0.5; });

    const onSpot = this._inSpot();

    if (!this.turtle.isMoving && onSpot && eff > 0.1) {
      this._stillTime += dt;

      // Tell the player to keep standing still while they wait
      if (this._stillTime > 0.3 && this._stillTime < BASK_WAIT && !this._isBasking) {
        import('./ui.js').then(m => m.showMessage('Keep still… soaking up the sun ☀️', 1200));
      }

      if (this._stillTime >= BASK_WAIT) {
        const rate = ENERGY_RATE * eff;
        this.save.energy = Math.min(5, this.save.energy + rate * dt);

        if (!this._isBasking) {
          this._isBasking = true;
          this.turtle.isBasking = true;
          this.audio.play('bask');
          import('./ui.js').then(m => m.showMessage('Ahhh, warm sun ☀️', 2000));
        }
      }
    } else {
      this._stillTime = Math.max(0, this._stillTime - dt * 2);
      this.turtle.isBasking = false;
      if (this._stillTime <= 0 && this._isBasking) {
        this._isBasking = false;
      }

      // Low energy nudge — only when not already on a spot and sun is up
      if (this.save.energy < 2 && !onSpot && eff > 0.1 && this._lowEnergyHintCooldown === 0) {
        this._lowEnergyHintCooldown = 20;
        import('./ui.js').then(m =>
          m.showMessage('Getting tired… find a sunny patch and stand still to rest ☀️', 4000)
        );
      }
    }
  }
}
