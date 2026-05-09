import * as THREE from 'three';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function makeRaccoonMesh() {
  const g = new THREE.Group();

  // Body — wide low stance, warm brown-gray resists night blue tint
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 7, 6), flat(0x7a6450));
  body.scale.set(1.25, 0.82, 1.45);
  g.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 6, 5), flat(0x8a7460));
  head.position.set(0, 0.12, 0.72);
  g.add(head);

  // Pointed ears — the single clearest raccoon silhouette cue
  [-0.2, 0.2].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 5), flat(0x8a7460));
    ear.position.set(ex, 0.52, 0.68);
    g.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 5), flat(0xcc9080));
    inner.position.set(ex, 0.52, 0.7);
    g.add(inner);
  });

  // Bandit mask — wide dark patches, much more prominent than before
  [-0.14, 0.14].forEach(ex => {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.13, 5, 5), flat(0x111111));
    patch.position.set(ex, 0.15, 1.04);
    patch.scale.set(1.3, 0.85, 0.55);
    g.add(patch);
    // Amber eye within patch
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), flat(0xddaa44));
    eye.position.set(ex, 0.15, 1.08);
    g.add(eye);
  });

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 5, 4), flat(0x1a0800));
  nose.position.set(0, 0.04, 1.07);
  g.add(nose);

  // Ringed tail — horizontal behind body, alternating dark/tan bands
  for (let i = 0; i < 5; i++) {
    const r = 0.15 - i * 0.015;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 7), flat(i % 2 === 0 ? 0x7a6450 : 0x1a1208));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.18, -0.78 - i * 0.2);
    g.add(ring);
  }

  // Four stubby legs — makes it read as a ground animal not a bird
  [[0.42, 0.44], [-0.42, 0.44], [0.38, -0.44], [-0.38, -0.44]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.38, 5), flat(0x6a5440));
    leg.position.set(lx, -0.44, lz);
    g.add(leg);
  });

  return g;
}

export class Raccoon {
  constructor(scene, turtle, burrow, audio) {
    this.scene = scene;
    this.turtle = turtle;
    this.burrow = burrow;
    this._audio = audio;

    this._mesh = makeRaccoonMesh();
    this._mesh.visible = false;
    scene.add(this._mesh);

    this._active = false;
    this._angle = 0;
    this._lifetime = 0;
  }

  update(dt) {
    const dayNight = window._dayNight;
    const isEvening = dayNight ? dayNight.isEvening : false;
    const isNight = dayNight ? dayNight.isNight : false;

    if ((isEvening || isNight) && !this._active && Math.random() < dt * 0.003) {
      this._spawn();
    }

    if (!this._active) return;

    this._lifetime += dt;
    this._scareCooldown = Math.max(0, (this._scareCooldown || 0) - dt);

    // Variable speed — drifts between slow sniff and brisk waddle
    const speed = 0.55 + Math.sin(this._lifetime * 0.9) * 0.28 + Math.sin(this._lifetime * 0.31) * 0.15;
    this._angle += dt * Math.max(0.08, speed);

    // Irregular radius — two overlapping sine waves so it never feels like a track
    const r = 3.5 + Math.sin(this._angle * 1.7) * 0.75 + Math.sin(this._angle * 0.85 + 1.1) * 0.45;

    // Waddle bob — height pulses with each step
    const bob = Math.abs(Math.sin(this._lifetime * 5.5)) * 0.1;

    this._mesh.position.set(
      Math.cos(this._angle) * r,
      0.65 + bob,
      Math.sin(this._angle) * r
    );
    this._mesh.rotation.y = -this._angle;

    // Side-to-side body rock tied to step cycle
    this._mesh.rotation.z = Math.sin(this._lifetime * 5.5) * 0.13;
    // Very slight nose-down lean — raccoons snuffle along the ground
    this._mesh.rotation.x = 0.12;

    // Scare turtle on contact
    const rx = this._mesh.position.x, rz = this._mesh.position.z;
    const contactDist = this.turtle.distanceTo(rx, rz);
    if (contactDist < 1.4 && !this.turtle.isInBurrow && this._scareCooldown <= 0) {
      this._scareCooldown = 5;
      this.turtle.save.hunger = Math.max(0.5, this.turtle.save.hunger - 1.0);
      this.turtle.save.energy = Math.max(0.5, this.turtle.save.energy - 0.8);
      this.turtle.shake(0.6);
      this._audio.play('raccoon');
      import('./ui.js').then(m => m.showMessage('🦝 The raccoon scared you! You dropped your food!', 2800));
    }

    // Push turtle away from burrow if they're trying to sneak past
    const turtleBurrowDist = this.turtle.distanceTo(0, 0);
    if (turtleBurrowDist < 2.5 && contactDist < 3 && !this.turtle.isInBurrow) {
      const dx = this.turtle.position.x;
      const dz = this.turtle.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      this.turtle.mesh.position.x += (dx / len) * 0.6 * dt;
      this.turtle.mesh.position.z += (dz / len) * 0.6 * dt;
    }

    if (this._lifetime > 30 || (!isEvening && !isNight)) {
      this._despawn();
    }
  }

  _spawn() {
    this._active = true;
    this._lifetime = 0;
    this._angle = Math.random() * Math.PI * 2;
    this._mesh.visible = true;
    import('./ui.js').then(m => m.showMessage('🦝 A raccoon is blocking the burrow!', 2500));
  }

  _despawn() {
    this._active = false;
    this._mesh.visible = false;
  }
}
