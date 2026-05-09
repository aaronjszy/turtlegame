import * as THREE from 'three';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

// Material for flat decals (pond, road, burrow ring) — polygon offset prevents z-fighting
// without needing to physically raise them far off the ground
function decal(color) {
  return new THREE.MeshLambertMaterial({
    color, flatShading: true,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
  });
}

// Slightly randomized ground with low-poly feel
function makeGround(scene) {
  const geo = new THREE.PlaneGeometry(200, 200, 30, 30);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, (Math.random() - 0.5) * 0.1);
  }
  geo.computeVertexNormals();
  // Warm sandy soil — longleaf pine sandhill
  const mesh = new THREE.Mesh(geo, flat(0xd4aa58));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Wiregrass tuft — the signature ground cover of longleaf pine sandhills
function addGrassTuft(scene, x, z) {
  const mat = flat(0x9aaa48);
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.28 + Math.random() * 0.18, 4),
      mat
    );
    blade.position.set(
      x + (Math.random() - 0.5) * 0.45,
      0.26,
      z + (Math.random() - 0.5) * 0.45
    );
    blade.rotation.z = (Math.random() - 0.5) * 0.5;
    blade.rotation.x = (Math.random() - 0.5) * 0.25;
    scene.add(blade);
  }
}

// Sandy patch (brighter area)
function sandPatch(scene, x, z, r) {
  const geo = new THREE.CircleGeometry(r, 8);
  const mesh = new THREE.Mesh(geo, decal(0xe8c878));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.06, z);
  scene.add(mesh);
  return mesh;
}

function addBush(scene, x, z, scale = 1, color = 0x6b8c42) {
  const geo = new THREE.IcosahedronGeometry(1.2 * scale, 0);
  const mesh = new THREE.Mesh(geo, flat(color));
  mesh.position.set(x, 0.8 * scale, z);
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

// Longleaf pine — tall straight trunk, small high canopy
function addTree(scene, x, z) {
  const h = 5 + Math.random() * 2;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, h, 6);
  const trunk = new THREE.Mesh(trunkGeo, flat(0x7a5030));
  trunk.position.set(x, h / 2, z);
  trunk.castShadow = true;
  scene.add(trunk);

  // Small sparse crown high up — characteristic longleaf silhouette
  const foliageGeo = new THREE.IcosahedronGeometry(1.8, 0);
  const foliage = new THREE.Mesh(foliageGeo, flat(0x3d6b2e));
  foliage.position.set(x, h + 1.2, z);
  foliage.castShadow = true;
  scene.add(foliage);
}

function addLog(scene, x, z, rotY = 0) {
  const geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
  const mesh = new THREE.Mesh(geo, flat(0x8b6347));
  mesh.rotation.z = Math.PI / 2;
  mesh.rotation.y = rotY;
  mesh.position.set(x, 0.3, z);
  mesh.castShadow = true;
  scene.add(mesh);
}

function addCloud(scene, x, y, z) {
  const g = new THREE.Group();
  const mat = flat(0xf0f4ff);
  [[0,0,0,1.5],[1.2,0.3,0,1],[-1,0.2,0,1.1],[0,0.4,0.8,0.9]].forEach(([cx,cy,cz,r]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
    m.position.set(cx, cy, cz);
    g.add(m);
  });
  g.position.set(x, y, z);
  scene.add(g);
}

// Pond
function makePond(scene) {
  const geo = new THREE.CircleGeometry(8, 12);
  const mesh = new THREE.Mesh(geo, decal(0x5ba8d8));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-20, 0.06, -22);
  scene.add(mesh);

  // lily pads
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 5;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.6 + Math.random() * 0.4, 7), decal(0x4a9e3f));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(-20 + Math.cos(angle) * r, 0.07, -22 + Math.sin(angle) * r);
    scene.add(pad);
  }
}

// Road along south edge
function makeRoad(scene) {
  const geo = new THREE.PlaneGeometry(200, 6);
  const mesh = new THREE.Mesh(geo, decal(0x555555));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.06, 55);
  scene.add(mesh);

  // Road markings
  for (let i = -10; i <= 10; i++) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.2), decal(0xffffcc));
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(i * 10, 0.07, 55);
    scene.add(mark);
  }
}

// World boundary shrubs (thick ring)
function makeBoundaries(scene) {
  // Dark forest floor outside the play area
  const forestFloor = new THREE.Mesh(
    new THREE.RingGeometry(56, 160, 64),
    flat(0x141e0a)
  );
  forestFloor.rotation.x = -Math.PI / 2;
  forestFloor.position.y = 0.06;
  scene.add(forestFloor);

  // Dense treeline — tall longleaf pines at the forest edge
  for (let a = 0; a < Math.PI * 2; a += 0.24) {
    const r = 63 + Math.random() * 12;
    const tx = Math.cos(a) * r;
    const tz = Math.sin(a) * r;
    const h = 7 + Math.random() * 5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, h, 5), flat(0x3c2510));
    trunk.position.set(tx, h / 2, tz);
    scene.add(trunk);
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 + Math.random() * 1.2, 0), flat(0x1a3010));
    canopy.position.set(tx, h + 1.2, tz);
    scene.add(canopy);
  }

  // Inner scrub ring — low shrubs just inside the treeline
  for (let a = 0; a < Math.PI * 2; a += 0.18) {
    const r = 58 + Math.random() * 4;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    addBush(scene, x, z, 1.5 + Math.random(), 0x3a6b2a);
  }

  // Creek (north boundary)
  const creek = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), flat(0x4d9ab0));
  creek.rotation.x = -Math.PI / 2;
  creek.position.set(0, 0.06, -54);
  scene.add(creek);
}

export const shrubPositions = [
  [6, -8], [-8, 4], [12, 12], [-14, -16], [4, -20], [-6, 18],
  [20, 2], [-18, 12], [8, -30], [-10, -28], [16, -12]
];

export class World {
  constructor(scene, turtleName) {
    this.scene = scene;
    this._turtleName = turtleName || 'Home';
    this._build();
  }

  _makeSignMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Wood background
    ctx.fillStyle = '#c8963c';
    ctx.fillRect(0, 0, 256, 128);

    // Dark wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 3;
    for (let y = 20; y < 128; y += 22) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y + 6); ctx.stroke();
    }

    // Name text — two lines: "[Name]'s" / "Burrow"
    const name = this._turtleName;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3b1a00';

    ctx.font = 'bold 38px "Comic Sans MS", cursive';
    ctx.fillText(`${name}'s`, 128, 52);

    ctx.font = 'bold 30px "Comic Sans MS", cursive';
    ctx.fillText('Burrow', 128, 92);

    const texture = new THREE.CanvasTexture(canvas);
    // The front face (+z) of BoxGeometry is material index 4
    return [
      flat(0xb07830), flat(0xb07830), // left, right
      flat(0xb07830), flat(0xb07830), // top, bottom
      new THREE.MeshLambertMaterial({ map: texture }), // front face — shows name
      flat(0xb07830),                                  // back
    ];
  }

  _build() {
    const scene = this.scene;
    this.colliders = []; // {x, z, r} circles — populated as solid objects are placed

    const groundMesh = makeGround(scene);
    this.groundMeshes = [groundMesh]; // raycasting targets for terrain height sampling
    makeBoundaries(scene);
    makeRoad(scene);
    makePond(scene);

    // Pond is solid water — large circle collider
    this.colliders.push({ x: -20, z: -22, r: 7.5 });

    // Sandy Clearing (south)
    this.groundMeshes.push(sandPatch(scene, 10, 28, 8));

    // Berry Patch (northeast) — shrubs are passable (soft vegetation)
    for (let i = 0; i < 15; i++) {
      const x = 22 + (Math.random() - 0.5) * 14;
      const z = -18 + (Math.random() - 0.5) * 14;
      addBush(scene, x, z, 0.6 + Math.random() * 0.4, 0x5a8832);
    }

    // Scrub Forest Edge (west) — trees are solid
    const treeSeed = 42; // use fixed positions so colliders match visuals
    const treePositions = [];
    for (let i = 0; i < 8; i++) {
      // Deterministic-ish positions using sine so they're the same each load
      const x = -28 + Math.sin(i * 2.1) * 6;
      const z = Math.sin(i * 1.7 + 1) * 15;
      treePositions.push([x, z]);
      addTree(scene, x, z);
      this.colliders.push({ x, z, r: 1.2 });
    }

    // Logs — approximate each as two overlapping circles along their length
    const logs = [
      { x: -22, z: -5,  rotY: 0.4  },
      { x: -25, z:  8,  rotY: -0.3 },
    ];
    logs.forEach(({ x, z, rotY }) => {
      addLog(scene, x, z, rotY);
      // Cylinder axis after rotation.z=PI/2 then rotation.y=rotY (XYZ Euler): (-cos(rotY), 0, sin(rotY))
      const ax = -Math.cos(rotY), az = Math.sin(rotY);
      [-1.5, -0.5, 0.5, 1.5].forEach(t => {
        this.colliders.push({ x: x + ax * t, z: z + az * t, r: 0.48 });
      });
    });

    // Scattered vegetation across meadow
    shrubPositions.forEach(([x, z]) => addBush(scene, x, z, 0.5 + Math.random() * 0.5));

    // Clouds
    addCloud(scene, -30, 25, -20);
    addCloud(scene, 20, 28, -35);
    addCloud(scene, 5, 22, 10);
    addCloud(scene, -15, 26, 15);

    // Burrow entrance — dirt mound ring with a clear dark hole and a "Home" sign
    // Surrounding dirt ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 2.2, 14),
      decal(0xb8913a)
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.06, 0);
    scene.add(ring);
    this.groundMeshes.push(ring);

    // Low mound ridge around hole
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const clod = new THREE.Mesh(
        new THREE.SphereGeometry(0.28 + Math.random() * 0.12, 5, 4),
        flat(0xc4a050)
      );
      clod.position.set(Math.cos(a) * 1.0, 0.12, Math.sin(a) * 1.0);
      scene.add(clod);
    }

    // The hole itself — dark oval, clearly a tunnel opening
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.68, 12), decal(0x0d0700));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(0, 0.07, 0);
    scene.add(hole);

    // "Home" sign — a wooden stake with a little board
    const stakeGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6);
    const stake = new THREE.Mesh(stakeGeo, flat(0x8b6347));
    stake.position.set(1.6, 0.6, -1.0);
    stake.rotation.z = 0.12;
    scene.add(stake);

    const boardGeo = new THREE.BoxGeometry(0.9, 0.5, 0.08);
    const board = new THREE.Mesh(boardGeo, this._makeSignMaterial());
    board.position.set(1.6, 1.3, -1.0);
    board.rotation.z = 0.12;
    scene.add(board);
  }
}
