import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this._scene = scene;
    this._active = [];
  }

  burst(x, y, z, color, count = 9) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 4, 3),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(x, y, z);
      this._scene.add(mesh);

      const speed = 1.8 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const rise  = 0.4 + Math.random() * 0.6;

      this._active.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: rise * speed,
        vz: Math.sin(angle) * speed,
        life: 1.0,
      });
    }
  }

  update(dt) {
    this._active = this._active.filter(p => {
      p.life -= dt * 2.8;
      p.vy   -= 6 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(Math.max(0, p.life));

      if (p.life <= 0) { this._scene.remove(p.mesh); return false; }
      return true;
    });
  }
}
