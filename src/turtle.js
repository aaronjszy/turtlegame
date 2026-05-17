import * as THREE from 'three';

const GROWTH_SCALES = [0.22, 0.34, 0.50, 0.68, 0.84, 1.0];
const MOVE_SPEED = [1.9, 2.2, 2.6, 3.0, 3.3, 3.5]; // grows faster as turtle matures
const TURN_SPEED = 1.8;
const WORLD_RADIUS = 52;
const GROUND_Y_BASE = 0.6; // leg bottom in local space — scale this with growth stage

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function buildTurtleMesh() {
  const g = new THREE.Group();

  // Body
  const bodyGeo = new THREE.SphereGeometry(1, 8, 6);
  bodyGeo.scale(1.2, 0.65, 1.0);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xd49838, emissive: 0x1d1404, flatShading: true }));
  body.castShadow = true;
  g.add(body);

  // Shell (dome) — medium olive-green base forms the scute border network.
  // Sits clearly against the sandy ground while still reading as a turtle.
  const shellGeo = new THREE.SphereGeometry(1.05, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.6);
  shellGeo.scale(1.15, 0.92, 1.0);
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshLambertMaterial({ color: 0x4a7018, emissive: 0x0c1404, flatShading: true }));
  shell.position.y = 0.1;
  shell.castShadow = true;
  g.add(shell);

  // Scute centers — bright warm amber on top of the darker base, like the real animal.
  const plateColor = new THREE.MeshLambertMaterial({ color: 0xedb010, emissive: 0x181000, flatShading: true });
  const platePositions = [
    [0,     0.92,  0,    0.38], // central vertebral
    [0.38,  0.80,  0.22, 0.28], // right costal, front
    [-0.38, 0.80,  0.22, 0.28], // left costal, front
    [0.38,  0.80, -0.22, 0.28], // right costal, back
    [-0.38, 0.80, -0.22, 0.28], // left costal, back
    [0,     0.76,  0.48, 0.25], // front marginal
    [0,     0.76, -0.48, 0.25], // rear marginal
  ];
  platePositions.forEach(([px, py, pz, r]) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 5), plateColor);
    p.position.set(px, py, pz);
    p.lookAt(px * 2, py * 2, pz * 2);
    g.add(p);
  });

  // Retractable parts — head, eyes, legs, tail pull inside when in shell
  const retractable = new THREE.Group();
  g.add(retractable);

  // Head
  const headGeo = new THREE.SphereGeometry(0.38, 7, 6);
  const head = new THREE.Mesh(headGeo, flat(0xcc9838));
  head.position.set(0, 0.05, 1.1);
  head.castShadow = true;
  retractable.add(head);

  // Eyes
  const eyeMat = flat(0x111111);
  [-0.14, 0.14].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), eyeMat);
    eye.position.set(ex, 0.18, 1.43);
    retractable.add(eye);
  });

  // Legs (4)
  const legMat = flat(0xcc9838);
  [
    [0.9, -0.3, 0.6], [-0.9, -0.3, 0.6],
    [0.85, -0.3, -0.6], [-0.85, -0.3, -0.6]
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 6), legMat);
    leg.position.set(lx, ly, lz);
    leg.rotation.z = lx > 0 ? 0.5 : -0.5;
    leg.rotation.x = lz > 0 ? -0.3 : 0.3;
    retractable.add(leg);
  });

  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 5), legMat);
  tail.position.set(0, -0.1, -1.0);
  tail.rotation.x = Math.PI / 2;
  retractable.add(tail);

  // Expose retractable group so Turtle class can animate it
  g.userData.retractable = retractable;

  return g;
}

export class Turtle {
  constructor(scene, camera, save, colliders = [], groundMeshes = []) {
    this.scene = scene;
    this.camera = camera;
    this.save = save;
    this._colliders = colliders;
    this._groundMeshes = groundMeshes;
    this._terrainRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));

    this.mesh = buildTurtleMesh();
    this._retractable = this.mesh.userData.retractable;
    const p = save.turtlePos;
    this.mesh.position.set(p.x, this.groundY, p.z);
    this.mesh.rotation.y = save.turtleRotY || 0;
    this._applyScale();
    scene.add(this.mesh);

    // Camera rig
    this._camOffset = new THREE.Vector3(0, 3.5, -7);
    this._camTarget = new THREE.Vector3();
    this._camPos = this.mesh.position.clone().add(this._camOffset);
    this._camOrbitAngle = 0; // extra yaw offset from mouse drag; 0 = behind turtle

    this._setupMouseOrbit();

    // Input state
    this._keys = {};
    window.addEventListener('keydown', e => { this._keys[e.code] = true; });
    window.addEventListener('keyup', e => { this._keys[e.code] = false; });

    this._joystick = { x: 0, y: 0, active: false };
    this._setupTouchJoystick();

    this.inShell = false;
    this._shellTime = 0;

    this.walkTime = 0;
    this.headBobTime = 0;
    this.isMoving = false;
    this.isBasking = false;
    this.isInBurrow = false;

    this._legMeshes = [];
    this.mesh.traverse(c => {
      if (c.isMesh && c !== this.mesh) this._legMeshes.push(c);
    });

    this._headMesh = null;
    this.mesh.children.forEach((c, i) => {
      if (i === 0) return; // body
      // head is index 9 (after body, shell, 7 plates)
    });
    // Find head by position
    this.mesh.children.forEach(c => {
      if (c.isMesh && Math.abs(c.position.z - 1.1) < 0.1) this._headMesh = c;
    });
  }

  get position() { return this.mesh.position; }
  get rotationY() { return this.mesh.rotation.y; }
  get groundY() { return GROUND_Y_BASE * GROWTH_SCALES[this.save.growthStage]; }

  _terrainHeight(x, z) {
    if (this._groundMeshes.length === 0) return 0;
    this._terrainRay.ray.origin.set(x, 10, z);
    const hits = this._terrainRay.intersectObjects(this._groundMeshes);
    return hits.length > 0 ? hits[0].point.y : 0;
  }

  _applyScale() {
    const s = GROWTH_SCALES[this.save.growthStage];
    this.mesh.scale.setScalar(s);
  }

  get speedMultiplier() {
    const h = this.save.hunger / 5;
    const e = this.save.energy / 5;
    // Wide range (0.18–1.0) so low stats produce a clearly noticeable drag
    return 0.18 + 0.82 * Math.min(h, e);
  }

  update(dt) {
    if (this.isInBurrow) {
      this._updateCamera(dt);
      return;
    }

    const k = this._keys;

    // Shell mechanic — retract limbs/head, keep shell intact
    if (k['Space'] && !this.inShell) {
      this.inShell = true;
      this._shellTime = 0;
    }
    if (this.inShell) {
      this._shellTime += dt;
      // Smoothly shrink retractable parts into shell
      const s = Math.max(0, 1 - this._shellTime / 0.25);
      this._retractable.scale.setScalar(s);

      if (!k['Space'] && this._shellTime > 1.0) {
        this.inShell = false;
      }
      this._updateCamera(dt);
      return;
    }

    // Smoothly extend back out after leaving shell
    if (this._retractable.scale.x < 1) {
      const s = Math.min(1, this._retractable.scale.x + dt / 0.3);
      this._retractable.scale.setScalar(s);
    }

    const spd = MOVE_SPEED[this.save.growthStage] * this.speedMultiplier;
    let moved = false;

    if (k['KeyW'] || k['ArrowUp']) {
      const dx = Math.sin(this.mesh.rotation.y) * spd * dt;
      const dz = Math.cos(this.mesh.rotation.y) * spd * dt;
      this.mesh.position.x += dx;
      this.mesh.position.z += dz;
      moved = true;
    }
    if (k['KeyS'] || k['ArrowDown']) {
      const dx = Math.sin(this.mesh.rotation.y) * spd * dt;
      const dz = Math.cos(this.mesh.rotation.y) * spd * dt;
      this.mesh.position.x -= dx * 0.5;
      this.mesh.position.z -= dz * 0.5;
      moved = true;
    }
    if (k['KeyA'] || k['ArrowLeft']) {
      this.mesh.rotation.y += TURN_SPEED * dt;
    }
    if (k['KeyD'] || k['ArrowRight']) {
      this.mesh.rotation.y -= TURN_SPEED * dt;
    }

    // Touch joystick
    if (this._joystick.active) {
      const jy = this._joystick.y;
      const jx = this._joystick.x;
      if (Math.abs(jy) > 0.12) {
        this.mesh.position.x += Math.sin(this.mesh.rotation.y) * spd * dt * jy;
        this.mesh.position.z += Math.cos(this.mesh.rotation.y) * spd * dt * jy;
        moved = true;
      }
      if (Math.abs(jx) > 0.12) {
        this.mesh.rotation.y -= TURN_SPEED * dt * jx;
      }
    }

    // World boundary clamp (circular)
    const dist = Math.sqrt(this.mesh.position.x ** 2 + this.mesh.position.z ** 2);
    if (dist > WORLD_RADIUS) {
      this.mesh.position.x = (this.mesh.position.x / dist) * WORLD_RADIUS;
      this.mesh.position.z = (this.mesh.position.z / dist) * WORLD_RADIUS;
    }

    // Road boundary (z > 50)
    if (this.mesh.position.z > 50) {
      this.mesh.position.z = 50;
      this._triggerRoadWarning();
    }

    // Solid object collisions — push turtle out of any overlapping circle
    const turtleR = 0.55 * GROWTH_SCALES[this.save.growthStage];
    for (const c of this._colliders) {
      const dx = this.mesh.position.x - c.x;
      const dz = this.mesh.position.z - c.z;
      const distSq = dx * dx + dz * dz;
      const minDist = turtleR + c.r;
      if (distSq < minDist * minDist && distSq > 0) {
        const d = Math.sqrt(distSq);
        this.mesh.position.x = c.x + (dx / d) * minDist;
        this.mesh.position.z = c.z + (dz / d) * minDist;
      }
    }

    this.isMoving = moved;

    // Visually connect walking to energy drain — pulse the energy HUD while moving
    document.body.classList.toggle('turtle-moving', moved);

    // One-time hint the very first time the player walks
    if (moved && !this.save.shownWalkHint) {
      this.save.shownWalkHint = true;
      import('./ui.js').then(m => m.showMessage(
        'Walking uses your energy ☀️ — rest on a sunny gold patch to recharge!', 4500
      ));
    }

    // Leg animation
    if (moved) {
      this.walkTime += dt * 6;
    }

    // Head idle look
    this.headBobTime += dt;
    if (this._headMesh) {
      this._headMesh.rotation.y = Math.sin(this.headBobTime * 0.7) * 0.2;
      this._headMesh.position.y = 0.05 + Math.sin(this.headBobTime * 1.2) * 0.03;
    }

    // Smooth terrain height to prevent snapping at geometry edges
    const targetTh = this._terrainHeight(this.mesh.position.x, this.mesh.position.z);
    if (this._smoothTh === undefined) this._smoothTh = targetTh;
    this._smoothTh += (targetTh - this._smoothTh) * Math.min(1, dt * 12);

    // Walk bob on whole mesh
    if (moved) {
      this.mesh.position.y = this._smoothTh + this.groundY + Math.abs(Math.sin(this.walkTime * 2)) * 0.06;
    } else {
      this.mesh.position.y = this._smoothTh + this.groundY;
    }

    // Drains energy while moving
    if (moved) {
      this.save.energy = Math.max(0.5, this.save.energy - dt * 0.03);
    }

    // Drains hunger slowly over time (indigo snake slows it by 25%)
    const hungerRate = (this.save.friendsMovedin || []).includes('indigo_snake') ? 0.006 : 0.008;
    this.save.hunger = Math.max(0.5, this.save.hunger - dt * hungerRate);

    this._checkStatHints(dt);

    this._updateCamera(dt);

    // Persist position periodically
    this._saveTimer = (this._saveTimer || 0) + dt;
    if (this._saveTimer > 5) {
      this._saveTimer = 0;
      this.save.turtlePos = { x: this.mesh.position.x, y: 0, z: this.mesh.position.z };
      this.save.turtleRotY = this.mesh.rotation.y;
      this.save.save();
    }
  }

  _checkStatHints(dt) {
    this._hintCooldown = (this._hintCooldown || 0) - dt;
    if (this._hintCooldown > 0) return;

    const h = this.save.hunger;
    const e = this.save.energy;
    const slow = this.speedMultiplier < 0.7;

    // Explain the slowdown first — that's the most confusing symptom
    if (slow && this.isMoving) {
      if (h <= e && h < 2) {
        this._hintCooldown = 25;
        import('./ui.js').then(m => m.showMessage(
          'Moving slowly — too hungry! Walk over berries, flowers or grass to eat 🍃', 4000
        ));
        return;
      }
      if (e < 2) {
        this._hintCooldown = 25;
        import('./ui.js').then(m => m.showMessage(
          'Moving slowly — too tired! Find a sunny gold patch and stand still to rest ☀️', 4000
        ));
        return;
      }
    }

    // Gentler nudge before it affects movement
    if (h < 2 && h <= e) {
      this._hintCooldown = 30;
      import('./ui.js').then(m => m.showMessage(
        'Getting hungry! Walk over any food on the ground to eat 🍃', 3500
      ));
    }
  }

  _setupMouseOrbit() {
    let dragging = false;
    let lastX = 0;

    const onDown = e => { dragging = true; lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0; };
    const onUp = () => { dragging = false; };
    const onMove = e => {
      if (!dragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = x - lastX;
      lastX = x;
      this._camOrbitAngle -= dx * 0.008;
      // clamp so the camera can't flip upside-down or go underground
      this._camOrbitAngle = Math.max(-Math.PI, Math.min(Math.PI, this._camOrbitAngle));
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
  }

  _setupTouchJoystick() {
    const R = 48; // base radius px

    const base = document.createElement('div');
    base.style.cssText = `
      position:fixed; bottom:28px; left:28px; width:${R*2}px; height:${R*2}px;
      border-radius:50%; background:rgba(255,255,255,0.12); border:3px solid rgba(255,255,255,0.25);
      pointer-events:all; z-index:30; touch-action:none; display:none;
    `;
    const thumb = document.createElement('div');
    thumb.style.cssText = `
      position:absolute; width:42px; height:42px; border-radius:50%;
      background:rgba(255,255,255,0.38); top:50%; left:50%;
      transform:translate(-50%,-50%); pointer-events:none; transition:transform 0.05s;
    `;
    base.appendChild(thumb);
    document.body.appendChild(base);

    // Show only on touch-capable devices
    if (navigator.maxTouchPoints > 0) base.style.display = 'block';

    let touchId = null;
    let cx = 0, cy = 0;

    base.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = base.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top  + rect.height / 2;
      this._joystick.active = true;
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (!this._joystick.active) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== touchId) continue;
        const dx = t.clientX - cx;
        const dy = t.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const capped = Math.min(dist, R);
        const nx = (dx / dist) * capped;
        const ny = (dy / dist) * capped;
        this._joystick.x =  nx / R;
        this._joystick.y = -ny / R; // screen Y is inverted vs world Z
        thumb.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      }
    }, { passive: true });

    const onEnd = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchId) {
          touchId = null;
          this._joystick = { x: 0, y: 0, active: false };
          thumb.style.transform = 'translate(-50%, -50%)';
        }
      }
    };
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  _updateCamera(dt) {
    const mesh = this.mesh;

    // When walking, ease orbit angle back to 0 (behind turtle)
    if (this.isMoving) {
      this._camOrbitAngle *= Math.max(0, 1 - 4 * dt);
    }

    // C key: toggle face view (orbit to Math.PI = directly in front)
    if (this._keys['KeyC']) {
      const target = Math.abs(this._camOrbitAngle - Math.PI) < 0.1 ? 0 : Math.PI;
      this._camOrbitAngle += (target - this._camOrbitAngle) * Math.min(1, 6 * dt);
    }

    const offset = this._camOffset.clone();
    offset.applyEuler(new THREE.Euler(0, mesh.rotation.y + this._camOrbitAngle, 0));
    const desired = mesh.position.clone().add(offset);
    desired.y = Math.max(desired.y, 1.5);

    this._camPos.lerp(desired, 8 * dt);
    this.camera.position.copy(this._camPos);

    this._camTarget.lerp(
      mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
      10 * dt
    );
    this.camera.lookAt(this._camTarget);
  }

  _roadWarnCooldown = 0;
  _triggerRoadWarning() {
    if (this._roadWarnCooldown > 0) return;
    this._roadWarnCooldown = 3;
    // Screen shake
    this._shake(0.5);
    import('./ui.js').then(m => m.showMessage('🚗 Too dangerous!', 2000));
    setTimeout(() => { this._roadWarnCooldown = 0; }, 3000);
  }

  shake(duration = 0.4) { this._shake(duration); }

  _shake(duration) {
    const start = performance.now();
    const origin = this.camera.position.clone();
    const fn = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed > duration) return;
      this.camera.position.x += (Math.random() - 0.5) * 0.3;
      this.camera.position.y += (Math.random() - 0.5) * 0.15;
      requestAnimationFrame(fn);
    };
    requestAnimationFrame(fn);
  }

  distanceTo(x, z) {
    return Math.sqrt((this.mesh.position.x - x) ** 2 + (this.mesh.position.z - z) ** 2);
  }

  applyGrowthStage() {
    this._applyScale();
  }
}
