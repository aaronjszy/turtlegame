import * as THREE from 'three';

export class Fireflies {
  constructor(scene) {
    this._scene = scene;
    this._flies = [];
    this._time = 0;
    this._visible = false;

    for (let i = 0; i < 15; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0xddff88 })
      );
      const angle = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 36;
      const baseY = 0.6 + Math.random() * 1.8;
      mesh.position.set(Math.cos(angle) * r, baseY, Math.sin(angle) * r);
      mesh.visible = false;
      scene.add(mesh);

      this._flies.push({
        mesh,
        baseX: mesh.position.x,
        baseZ: mesh.position.z,
        baseY,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.25 + Math.random() * 0.35,
        pulseSpeed: 2.5 + Math.random() * 2.0,
      });
    }
  }

  update(dt) {
    this._time += dt;
    const dayNight = window._dayNight;
    const shouldShow = dayNight ? (dayNight.isEvening || dayNight.isNight) : false;

    if (shouldShow !== this._visible) {
      this._visible = shouldShow;
      this._flies.forEach(f => { f.mesh.visible = shouldShow; });
    }

    if (!shouldShow) return;

    this._flies.forEach(f => {
      f.baseX += Math.sin(this._time * f.driftSpeed + f.phase) * dt * 0.3;
      f.baseZ += Math.cos(this._time * f.driftSpeed * 0.8 + f.phase + 1.0) * dt * 0.3;

      // Keep within world bounds
      const dist = Math.sqrt(f.baseX ** 2 + f.baseZ ** 2);
      if (dist > 48) { f.baseX *= 48 / dist; f.baseZ *= 48 / dist; }

      const bob = Math.sin(this._time * 1.4 + f.phase) * 0.25;
      f.mesh.position.set(f.baseX, f.baseY + bob, f.baseZ);

      const pulse = 0.65 + Math.sin(this._time * f.pulseSpeed + f.phase) * 0.35;
      f.mesh.scale.setScalar(pulse);
    });
  }
}
