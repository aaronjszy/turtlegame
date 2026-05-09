import * as THREE from 'three';
import { shrubPositions } from './world.js';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

const HAWK_INTERVAL_MIN = 45;
const HAWK_INTERVAL_MAX = 90;

const SHRUB_COVER_R = 2.2; // radius around each bush that counts as cover

function isOpenArea(x, z) {
  // Burrow area
  if (x * x + z * z < 9) return false;
  // Scrub forest edge (west)
  if (x < -15 && Math.abs(z) < 18) return false;
  // Berry patch (northeast)
  if (x > 18 && z < -12) return false;
  // Any scattered bush
  for (const [sx, sz] of shrubPositions) {
    const dx = x - sx, dz = z - sz;
    if (dx * dx + dz * dz < SHRUB_COVER_R * SHRUB_COVER_R) return false;
  }
  return true;
}

function makeShadow() {
  const geo = new THREE.CircleGeometry(1.0, 8);
  geo.scale(1.2, 0.58, 1); // stretch into ellipse
  const mesh = new THREE.Mesh(geo, flat(0x222222));
  mesh.material.transparent = true;
  mesh.material.opacity = 0.35;
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function makeHawkMesh() {
  const g = new THREE.Group();
  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), flat(0x8b6340));
  g.add(body);
  // Wings
  [-1, 1].forEach(side => {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 0.7),
      flat(0x7a5530)
    );
    wing.position.set(side * 1.1, 0, 0);
    wing.rotation.z = side * 0.3;
    g.add(wing);
  });
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), flat(0x6b4f28));
  head.position.set(0, 0.2, 0.5);
  g.add(head);
  return g;
}

export class Hawk {
  constructor(scene, turtle, save, audio, showMessage, hud) {
    this.scene = scene;
    this.turtle = turtle;
    this.save = save;
    this.audio = audio;
    this.showMessage = showMessage;
    this.hud = hud;

    this._timer = HAWK_INTERVAL_MIN + Math.random() * (HAWK_INTERVAL_MAX - HAWK_INTERVAL_MIN);
    this._state = 'idle'; // idle | circling | diving | retreating

    this._mesh = makeHawkMesh();
    this._mesh.visible = false;
    scene.add(this._mesh);

    this._shadow = makeShadow();
    this._shadow.visible = false;
    scene.add(this._shadow);

    this._circleAngle = 0;
    this._diveProgress = 0;
    this._diveOrigin = new THREE.Vector3();
    this._diveTarget = new THREE.Vector3();
  }

  update(dt) {
    if (this.turtle.isInBurrow) return;

    if (this._state === 'idle') {
      this._timer -= dt;
      if (this._timer <= 0) this._startCircle();
      return;
    }

    if (this._state === 'circling') {
      this._circleAngle += dt * 0.8;
      const tx = this.turtle.position.x;
      const tz = this.turtle.position.z;
      const r = 18;
      const hx = tx + Math.cos(this._circleAngle) * r;
      const hz = tz + Math.sin(this._circleAngle) * r;
      this._mesh.position.set(hx, 22, hz);
      this._shadow.position.set(hx, 0.02, hz);

      // Shadow approaches as hawk prepares to dive
      this._circleTime = (this._circleTime || 0) + dt;
      const hasOwl = (this.save.friendsMovedin || []).includes('burrowing_owl');
      const circleLimit = hasOwl ? 7.0 : 4.0;
      if (hasOwl && this._circleTime > 3.5 && !this._owlWarned) {
        this._owlWarned = true;
        this.showMessage('🦉 Your owl spotted the hawk — find cover fast!', 2500);
      }
      if (this._circleTime > circleLimit) {
        this._startDive();
      }
      return;
    }

    if (this._state === 'diving') {
      this._diveProgress += dt * 1.2;
      this._mesh.position.lerpVectors(this._diveOrigin, this._diveTarget, this._diveProgress);
      this._shadow.position.x = this.turtle.position.x;
      this._shadow.position.z = this.turtle.position.z;

      if (this._diveProgress >= 1.0) {
        this._impactCheck();
        this._state = 'retreating';
        this._diveProgress = 0;
      }
      return;
    }

    if (this._state === 'retreating') {
      this._mesh.position.y += dt * 10;
      if (this._mesh.position.y > 30) this._reset();
    }
  }

  _startCircle() {
    this._state = 'circling';
    this._circleTime = 0;
    this._circleAngle = Math.random() * Math.PI * 2;
    this._mesh.visible = true;
    this._shadow.visible = true;
    this.showMessage('🦅 A hawk is circling!', 2500);
  }

  _startDive() {
    this._state = 'diving';
    this._diveOrigin.copy(this._mesh.position);
    this._diveTarget.set(this.turtle.position.x, 1, this.turtle.position.z);
    this._diveProgress = 0;
    this.audio.play('hawk');
  }

  _impactCheck() {
    const tx = this.turtle.position.x;
    const tz = this.turtle.position.z;

    // Safe if in shell
    if (this.turtle.inShell) {
      this.showMessage('Safe in your shell! 🐢', 2000);
      return;
    }

    // Safe if in cover area
    if (!isOpenArea(tx, tz)) {
      this.showMessage('The hawk missed — good hiding spot!', 2000);
      return;
    }

    // Got startled — costs both hunger and energy so the player has to eat AND rest
    this.save.hunger = Math.max(0.5, this.save.hunger - 1.5);
    this.save.energy = Math.max(0.5, this.save.energy - 1.0);
    this.turtle.shake(0.8);
    this.hud?.flashStat('hunger');
    setTimeout(() => this.hud?.flashStat('energy'), 200);
    this.showMessage('😱 The hawk scared you! You need food and rest!', 3000);
  }

  _reset() {
    this._state = 'idle';
    this._mesh.visible = false;
    this._shadow.visible = false;
    this._timer = HAWK_INTERVAL_MIN + Math.random() * (HAWK_INTERVAL_MAX - HAWK_INTERVAL_MIN);
    this._circleTime = 0;
    this._owlWarned = false;
  }
}
