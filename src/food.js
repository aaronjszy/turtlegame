import * as THREE from 'three';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

const FOOD_TYPES = [
  { id: 'gopher_apple',   color: 0xffcc33, scale: 0.35, spawnY: 0.35, hunger: 2.0, rarity: 0.06, name: 'Gopher Apple' },
  { id: 'palmetto_berry', color: 0x8844cc, scale: 0.22, spawnY: 0.22, hunger: 0.8, rarity: 0.25, name: 'Palmetto Berry' },
  { id: 'flower',         color: 0xff66aa, scale: 0.25, spawnY: 0.0,  hunger: 0.7, rarity: 0.25, name: 'Flower' },
  { id: 'mushroom',       color: 0xcc6633, scale: 0.28, spawnY: 0.15, hunger: 1.2, rarity: 0.14, name: 'Mushroom', scrubOnly: true },
  { id: 'grass',          color: 0x88cc44, scale: 0.18, spawnY: 0.0,  hunger: 0.4, rarity: 0.30, name: 'Grass' },
];

const EAT_RADIUS = 1.0;
const FOOD_COUNT = 18;

function randomWorldPos(type) {
  // Mushrooms only in scrub forest (west: x -15 to -35)
  if (type.scrubOnly) {
    return {
      x: -20 + (Math.random() - 0.5) * 18,
      z: (Math.random() - 0.5) * 30,
    };
  }
  // Berry patch (northeast)
  if (type.id === 'palmetto_berry' && Math.random() < 0.5) {
    return { x: 20 + (Math.random() - 0.5) * 12, z: -18 + (Math.random() - 0.5) * 12 };
  }
  const angle = Math.random() * Math.PI * 2;
  const r = 4 + Math.random() * 42;
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
}

function makeFoodMesh(type) {
  let mesh;
  if (type.id === 'gopher_apple') {
    const g = new THREE.Group();
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(type.scale, 6, 6), flat(type.color));
    g.add(fruit);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 5), flat(0x5a3a0a));
    stem.position.y = type.scale + 0.1;
    g.add(stem);
    mesh = g;
  } else if (type.id === 'flower') {
    const g = new THREE.Group();

    // Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.28, 5), flat(0x55aa33));
    stem.position.y = 0.14;
    g.add(stem);

    // Flat oval petals fanned out horizontally at stem top
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(type.scale * 0.55, 5, 4), flat(type.color));
      const angle = (i / 6) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * type.scale * 0.75, 0.29, Math.sin(angle) * type.scale * 0.75);
      petal.scale.set(0.4, 0.18, 0.85);
      petal.rotation.y = angle + Math.PI / 2;
      g.add(petal);
    }

    // Yellow center
    const center = new THREE.Mesh(new THREE.SphereGeometry(type.scale * 0.38, 6, 5), flat(0xffee22));
    center.position.y = 0.3;
    g.add(center);

    mesh = g;
  } else if (type.id === 'mushroom') {
    const g = new THREE.Group();
    // Stalk bottom at local y=0
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6), flat(0xeedd99));
    stalk.position.y = 0.15;
    g.add(stalk);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(type.scale, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.6), flat(type.color));
    cap.position.y = 0.38;
    g.add(cap);
    mesh = g;
  } else if (type.id === 'grass') {
    const g = new THREE.Group();
    const mat = flat(type.color);
    for (let i = 0; i < 5; i++) {
      const h = 0.18 + Math.random() * 0.14;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 4), mat);
      blade.position.set(
        (Math.random() - 0.5) * 0.22,
        h / 2,
        (Math.random() - 0.5) * 0.22
      );
      blade.rotation.z = (Math.random() - 0.5) * 0.45;
      blade.rotation.x = (Math.random() - 0.5) * 0.2;
      g.add(blade);
    }
    mesh = g;
  } else {
    mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(type.scale, 0), flat(type.color));
  }
  return mesh;
}

export class FoodSystem {
  constructor(scene, turtle, save, audio, particles = null) {
    this.scene = scene;
    this.turtle = turtle;
    this.save = save;
    this.audio = audio;
    this._particles = particles;
    this._items = [];
    this._spawnAll();
  }

  _spawnAll() {
    this._items.forEach(item => this.scene.remove(item.mesh));
    this._items = [];

    const bonus = (this.save.friendsMovedin || []).includes('scarlet_snake') ? 5 : 0;
    for (let i = 0; i < FOOD_COUNT + bonus; i++) {
      const r = Math.random();
      let cum = 0;
      let type = FOOD_TYPES[FOOD_TYPES.length - 1];
      for (const t of FOOD_TYPES) {
        cum += t.rarity;
        if (r < cum) { type = t; break; }
      }

      const pos = randomWorldPos(type);
      const mesh = makeFoodMesh(type);
      mesh.position.set(pos.x, type.spawnY, pos.z);
      this.scene.add(mesh);
      this._items.push({ type, mesh, eaten: false });
    }
  }

  update(_dt) {
    if (this.turtle.isInBurrow) return;

    const tx = this.turtle.position.x;
    const tz = this.turtle.position.z;

    // Gentle bob animation
    const t = performance.now() / 1000;
    this._items.forEach((item, i) => {
      if (!item.eaten) {
        item.mesh.position.y = item.type.spawnY + Math.sin(t * 1.5 + i) * 0.05;
        item.mesh.rotation.y = t * 0.5 + i;
      }
    });

    // Proximity eat check
    this._items.forEach(item => {
      if (item.eaten) return;
      const dx = tx - item.mesh.position.x;
      const dz = tz - item.mesh.position.z;
      if (dx * dx + dz * dz < EAT_RADIUS * EAT_RADIUS) {
        this._eat(item);
      }
    });
  }

  _eat(item) {
    item.eaten = true;
    this.scene.remove(item.mesh);

    const s = this.save;
    s.hunger = Math.min(5, s.hunger + item.type.hunger);
    s.foodsEaten++;
    s.foodsEatenToday = (s.foodsEatenToday || 0) + 1;

    this.audio.play('eat');

    // Particle burst at food position
    this._particles?.burst(
      item.mesh.position.x,
      item.type.spawnY + 0.1,
      item.mesh.position.z,
      item.type.color
    );

    // Bounce the turtle slightly
    this.turtle.mesh.position.y = 0.15;
    setTimeout(() => { this.turtle.mesh.position.y = 0; }, 150);

    import('./ui.js').then(m => {
      // Every 5 foods eaten, show growth progress so the player knows why eating matters
      const goal = s.growthStage === 0 ? 30 : s.growthStage === 1 ? 100 : null;
      if (goal && s.foodsEaten % 5 === 0) {
        m.showMessage(`Yum! ${item.type.name} 🍃 ${s.foodsEaten}/${goal} foods to grow bigger!`, 2500);
      } else {
        m.showMessage(`Yum! ${item.type.name}`, 1200);
      }
    });
  }

  respawn() {
    this._spawnAll();
    this.save.foodsEatenToday = 0;
  }

  spawnNear(x, z, count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 4;
      const type = FOOD_TYPES[Math.floor(Math.random() * (FOOD_TYPES.length - 1))]; // skip grass
      const mesh = makeFoodMesh(type);
      mesh.position.set(x + Math.cos(angle) * r, type.spawnY, z + Math.sin(angle) * r);
      this.scene.add(mesh);
      this._items.push({ type, mesh, eaten: false });
    }
  }
}
