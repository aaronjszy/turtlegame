import * as THREE from 'three';

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

export const ANIMALS = [
  {
    id: 'cricket_frog',
    name: 'Cricket Frog',
    emoji: '🐸',
    minLevel: 0,
    color: 0x77cc55,
    perkDesc: '+1 extra energy when you sleep',
    greeting: [
      'Ribbit! Glad to be here!', 'I love the rain!', 'Best burrow ever!',
      'Did you see those fireflies last night? AMAZING!',
      'I found the best puddle by the pond!',
      'Ribbit ribbit ribbit!',
      'You look great today!',
      'I sang all night! Did you hear me?',
      'The bugs are SO good right now!',
      'Rain is coming, I can feel it!',
      'I did a really big jump earlier. Personal best!',
      'Everything is wonderful!',
      'I made friends with a beetle!',
    ],
    invite: "Hi! Can I move in? I\'m very cheerful!",
  },
  {
    id: 'indigo_snake',
    name: 'Indigo Snake',
    emoji: '🐍',
    minLevel: 1,
    color: 0x334477,
    perkDesc: 'Hunger drains 25% slower',
    greeting: [
      '...Hello.', 'All is well.', 'I am watching over you.',
      'I patrolled the perimeter.',
      'Rest easy. I am here.',
      'The hawk was circling earlier. It has gone.',
      '...Safe.',
      'You returned.',
      'I do not require much. I am content.',
      'Sleep well tonight.',
      'Nothing escapes my notice.',
      'This is a good burrow.',
      '...I am glad you are home.',
    ],
    invite: "I\'d like to stay here. I\'m calm and protective.",
  },
  {
    id: 'gopher_frog',
    name: 'Gopher Frog',
    emoji: '🐸',
    minLevel: 1,
    color: 0x88aa66,
    perkDesc: 'Restores a little hunger when you sleep',
    greeting: [
      '*peeks out shyly*', 'Oh! You\'re here...', '...hi.',
      '*hides behind a rock*',
      'Oh! I didn\'t hear you coming...',
      'I mostly come out when it\'s quiet...',
      '*blinks slowly*',
      'Is it night yet?',
      'I was just... sitting here. It\'s fine.',
      'Sorry, I\'m not very loud.',
      '...You\'re home.',
      '*very quiet ribbit*',
      'The dark is nice. Don\'t you think?',
    ],
    invite: "Um... can I move in? I mostly come out at night...",
  },
  {
    id: 'burrowing_owl',
    name: 'Burrowing Owl',
    emoji: '🦉',
    minLevel: 2,
    color: 0xb8935a,
    perkDesc: 'Hawk circles longer — more time to hide!',
    greeting: [
      'Why do clouds float?', 'Have you considered: worms?', 'Hm. Interesting.',
      'Did you know the sand remembers every step?',
      'I have been observing the clouds. Inconclusive.',
      'What is a burrow, really?',
      'The wiregrass was very still today. Suspicious.',
      'Fascinating. You\'ve returned again.',
      'I counted seventeen beetles. Then lost count.',
      'The wind changed direction at midday. I noted it.',
      'Have you considered: sand?',
      'I am thinking. Do not mind me.',
      'Something moved out there. Probably nothing. Probably.',
    ],
    invite: "Fascinating burrow! May I study it from within?",
  },
  {
    id: 'armadillo',
    name: 'Armadillo',
    emoji: '🦔',
    minLevel: 2,
    color: 0x997755,
    perkDesc: 'Each dig counts as two!',
    greeting: [
      'HELLO!!', 'Oh sorry I bumped into everything again', 'SO EXCITED TO BE HERE',
      'I JUST KNOCKED SOMETHING OVER BUT IT\'S FINE',
      'YOU\'RE BACK I\'M SO HAPPY!!',
      'I DID THREE DIGS TODAY!! THREE!!',
      'I LOVE THIS BURROW SO MUCH',
      'I found a beetle!! I ate it!! AMAZING!!',
      'Can we dig more?? I love digging!!',
      'I accidentally rolled into the wall again. Still great!!',
      'TODAY IS THE BEST DAY!!',
      'I was spinning in circles!! Just for fun!!',
      'I have SO much energy right now!!',
    ],
    invite: "OH WOW a burrow!! Can I PLEASE move in?!",
  },
  {
    id: 'scarlet_snake',
    name: 'Scarlet Snake',
    emoji: '🐍',
    minLevel: 3,
    color: 0xcc3333,
    perkDesc: 'Extra food appears each morning',
    greeting: [
      'Darling, this is simply stunning.', 'Red is MY color.', 'Magnificent.',
      'I have been resting. Beautifully.',
      'Your shell is quite striking, darling.',
      'I require more room, but I shall manage.',
      'Simply divine in here today.',
      'I was admiring my own scales earlier. Exquisite.',
      'The lighting in here suits me perfectly.',
      'Don\'t mind me, I\'m being radiant.',
      'Darling, you really must explore more. For the drama of it.',
      'I have never looked better. It\'s remarkable.',
      'Red and green. We are a stunning combination.',
    ],
    invite: "This burrow is ALMOST grand enough for me. Shall I grace it?",
  },
  {
    id: 'gopher_mouse',
    name: 'Gopher Mouse',
    emoji: '🐭',
    minLevel: 3,
    color: 0xddbb99,
    perkDesc: 'Leaves food by the burrow while you sleep',
    greeting: [
      'I brought you a berry!', '*tiny squeak*', 'So cozy in here!',
      'I saved you a seed!',
      '*excited tiny wiggles*',
      'I tidied up the corner a little!',
      'You were gone so long I got worried!',
      'I found something shiny! I hid it for you!',
      '*squeaks happily*',
      'I made it a little cozier while you were out!',
      'I\'m so small but I help SO much!',
      'Did you bring food? I brought food!',
      '*peeks out from a tiny hole*',
      'I counted all the seeds. There are many.',
    ],
    invite: "I\'m very small! I brought you a gift if I can stay!",
  },
];

const GREET_RADIUS = 7.0;
const ACCEPT_RADIUS = 2.0;

// ── Per-species mesh builders ────────────────────────────────────────────────

function buildCricketFrog() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 7, 6), flat(0x77cc55));
  body.scale.set(1.15, 0.8, 1.05);
  g.add(body);
  // Belly patch
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), flat(0xccee99));
  belly.position.set(0, -0.08, 0.28);
  belly.scale.set(1, 0.6, 0.5);
  g.add(belly);
  // Big bulgy eyes on top
  [-0.22, 0.22].forEach(ex => {
    const eyeDome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 5), flat(0xaaddaa));
    eyeDome.position.set(ex, 0.38, 0.18);
    g.add(eyeDome);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), flat(0x111111));
    pupil.position.set(ex, 0.38, 0.31);
    g.add(pupil);
  });
  // Wide smile line
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 4, 8, Math.PI), flat(0x448833));
  smile.position.set(0, -0.05, 0.42);
  smile.rotation.x = -0.3;
  g.add(smile);
  // Back legs splayed out
  [-1, 1].forEach(side => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.38, 5), flat(0x66bb44));
    thigh.position.set(side * 0.52, -0.25, -0.22);
    thigh.rotation.z = side * -0.9;
    g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.32, 5), flat(0x77cc55));
    shin.position.set(side * 0.82, -0.38, -0.38);
    shin.rotation.x = 0.6; shin.rotation.z = side * -0.4;
    g.add(shin);
  });
  return g;
}

function buildSnake(bodyColor, bandColor) {
  const g = new THREE.Group();
  // Coiled body — series of spheres along a curve
  const segments = 9;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const r = 0.18 - t * 0.06;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), flat(i % 2 === 0 ? bodyColor : (bandColor || bodyColor)));
    const angle = t * Math.PI * 1.4 - 0.4;
    seg.position.set(Math.cos(angle) * 0.55 * (1 - t * 0.3), 0.12 - t * 0.08, Math.sin(angle) * 0.4);
    g.add(seg);
  }
  // Head (slightly larger, at start of curve)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), flat(bodyColor));
  head.position.set(Math.cos(-0.4) * 0.55, 0.22, Math.sin(-0.4) * 0.4);
  head.scale.set(1.1, 0.85, 1.2);
  g.add(head);
  // Eyes
  const eyeAngle = -0.4;
  const hx = Math.cos(eyeAngle) * 0.55, hz = Math.sin(eyeAngle) * 0.4;
  [-0.1, 0.1].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), flat(0xffcc00));
    eye.position.set(hx + ex, 0.3, hz + 0.18);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), flat(0x111111));
    pupil.position.set(hx + ex, 0.3, hz + 0.22);
    g.add(pupil);
  });
  // Forked tongue
  const tongue = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), flat(0xdd2244));
  tongue.rotation.x = Math.PI / 2;
  tongue.position.set(hx, 0.2, hz + 0.34);
  g.add(tongue);
  return g;
}

function buildGopherFrog() {
  const g = new THREE.Group();
  // Rounder, chunkier than cricket frog — grayish green with spots
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 6), flat(0x8aaa77));
  body.scale.set(1.2, 0.85, 1.1);
  g.add(body);
  // Spots
  [[0.18, 0.28, 0.38], [-0.25, 0.22, 0.3], [0.05, 0.4, 0.28], [-0.1, 0.1, 0.48]].forEach(([sx, sy, sz]) => {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), flat(0x556644));
    spot.position.set(sx, sy, sz);
    spot.scale.set(1, 0.4, 1);
    g.add(spot);
  });
  // Eyes — set back, more reserved than cricket frog
  [-0.2, 0.2].forEach(ex => {
    const eyeDome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), flat(0x99bb88));
    eyeDome.position.set(ex, 0.42, 0.1);
    g.add(eyeDome);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), flat(0x222211));
    pupil.position.set(ex, 0.42, 0.22);
    g.add(pupil);
  });
  // Stubby legs tucked close (shy)
  [-1, 1].forEach(side => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 5), flat(0x7a9966));
    leg.position.set(side * 0.52, -0.28, 0.05);
    leg.rotation.z = side * -0.5;
    g.add(leg);
  });
  return g;
}

function buildBurrowingOwl() {
  const g = new THREE.Group();
  // Plump body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 6), flat(0xb8935a));
  body.scale.set(1, 1.25, 1);
  g.add(body);
  // Wing streaks
  [-1, 1].forEach(side => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), flat(0xa07840));
    wing.position.set(side * 0.42, 0.05, -0.1);
    wing.scale.set(0.5, 0.9, 0.7);
    g.add(wing);
  });
  // Round head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 7, 6), flat(0xc4a060));
  head.position.set(0, 0.62, 0.05);
  g.add(head);
  // Facial disc (pale)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.26, 10), flat(0xe8d4a8));
  disc.position.set(0, 0.62, 0.38);
  g.add(disc);
  // Big owl eyes
  [-0.13, 0.13].forEach(ex => {
    const eyeRing = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), flat(0xddbb66));
    eyeRing.position.set(ex, 0.68, 0.38);
    g.add(eyeRing);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), flat(0x111111));
    pupil.position.set(ex, 0.68, 0.46);
    g.add(pupil);
  });
  // Tiny beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), flat(0xcc9933));
  beak.position.set(0, 0.56, 0.46);
  beak.rotation.x = Math.PI / 2;
  g.add(beak);
  // Ear tufts
  [-0.14, 0.14].forEach(ex => {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), flat(0x987040));
    tuft.position.set(ex, 0.96, 0.02);
    g.add(tuft);
  });
  // Long legs (burrowing owls stand tall)
  [-0.14, 0.14].forEach(ex => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 5), flat(0xcc9944));
    leg.position.set(ex, -0.4, 0.04);
    g.add(leg);
  });
  return g;
}

function buildArmadillo() {
  const g = new THREE.Group();
  // Armored dome — main shell
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6),
    flat(0x997755)
  );
  shell.position.y = 0.08;
  g.add(shell);
  // Armor bands across the shell
  [0.05, 0.22, 0.38].forEach(z => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.42 - z * 0.3, 0.055, 4, 10, Math.PI * 2), flat(0x886644));
    band.position.set(0, 0.18 + z * 0.28, z * 0.15);
    band.rotation.x = 0.5 + z * 0.3;
    g.add(band);
  });
  // Long pointed snout
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 6), flat(0xaa8866));
  snout.position.set(0, 0.08, 0.7);
  snout.rotation.x = Math.PI / 2;
  g.add(snout);
  // Tiny eyes
  [-0.1, 0.1].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), flat(0x111111));
    eye.position.set(ex, 0.18, 0.52);
    g.add(eye);
  });
  // Stumpy legs
  [[0.36, 0.3], [-0.36, 0.3], [0.32, -0.3], [-0.32, -0.3]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.28, 5), flat(0xaa8866));
    leg.position.set(lx, -0.22, lz);
    g.add(leg);
  });
  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 5), flat(0x997755));
  tail.position.set(0, 0.1, -0.6);
  tail.rotation.x = -Math.PI / 2 + 0.3;
  g.add(tail);
  return g;
}

function buildGopherMouse() {
  const g = new THREE.Group();
  // Tiny body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 6), flat(0xddbb99));
  body.scale.set(1.1, 0.9, 1.2);
  g.add(body);
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 5), flat(0xddbb99));
  head.position.set(0, 0.14, 0.36);
  g.add(head);
  // Big round ears — the most mouse-like feature
  [-0.2, 0.2].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), flat(0xcc9988));
    ear.position.set(ex, 0.38, 0.26);
    ear.rotation.y = ex > 0 ? -0.3 : 0.3;
    g.add(ear);
    const innerEar = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), flat(0xeebba8));
    innerEar.position.set(ex, 0.38, 0.27);
    innerEar.rotation.y = ex > 0 ? -0.3 : 0.3;
    g.add(innerEar);
  });
  // Tiny eyes
  [-0.1, 0.1].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), flat(0x111111));
    eye.position.set(ex, 0.2, 0.58);
    g.add(eye);
  });
  // Pointed snout
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), flat(0xcc9977));
  snout.position.set(0, 0.1, 0.62);
  snout.scale.set(0.7, 0.6, 1.0);
  g.add(snout);
  // Long thin tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.7, 5), flat(0xccaa88));
  tail.position.set(0, 0.05, -0.52);
  tail.rotation.x = 0.4;
  g.add(tail);
  return g;
}

const MESH_BUILDERS = {
  cricket_frog:   buildCricketFrog,
  indigo_snake:   () => buildSnake(0x334477),
  gopher_frog:    buildGopherFrog,
  burrowing_owl:  buildBurrowingOwl,
  armadillo:      buildArmadillo,
  scarlet_snake:  () => buildSnake(0xcc3333, 0xffee22),
  gopher_mouse:   buildGopherMouse,
};

function makeFriendMesh(animal) {
  const builder = MESH_BUILDERS[animal.id];
  const g = builder ? builder() : (() => {
    const fallback = new THREE.Group();
    fallback.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 6), flat(animal.color)));
    return fallback;
  })();
  g.position.set(2, 0.5, 2);
  return g;
}

export class AnimalFriends {
  constructor(scene, turtle, burrow, save, audio, showMessage) {
    this.scene = scene;
    this.turtle = turtle;
    this.burrow = burrow;
    this.save = save;
    this.audio = audio;
    this.showMessage = showMessage;

    this._waiting = null; // animal currently waiting at entrance
    this._waitMesh = null;
    this._speechBubble = null;
    this._checkCooldown = 0;

    // Outdoor wandering friends
    this._outdoorFriends = [];
    this._outdoorTimer   = 25 + Math.random() * 30; // seconds until first wander-out
    this._outdoorBubble  = null;

    this._makeSpeechBubble();
    this._makeOutdoorBubble();
    this._scheduleNext();
  }

  _makeSpeechBubble() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; background:#fff; color:#333; border-radius:16px;
      padding:10px 16px; font-size:16px; max-width:240px; text-align:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.3); pointer-events:none;
      display:none; z-index:30; font-family:inherit;
    `;
    el.id = 'speechBubble';
    document.body.appendChild(el);
    this._speechBubble = el;
  }

  _makeOutdoorBubble() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; background:#fffde8; color:#333; border-radius:16px;
      padding:10px 16px; font-size:15px; max-width:220px; text-align:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.25); pointer-events:none;
      display:none; z-index:29; font-family:inherit;
      border:2px solid #f4c460;
    `;
    document.body.appendChild(el);
    this._outdoorBubble = el;
  }

  // Called by RainSystem when rain begins
  notifyRainStart() {
    const friends = this.save.friendsMovedin || [];
    let delay = 2200;

    if (friends.includes('cricket_frog')) {
      const lines = [
        'RAIN! Best day EVER!!',
        'I KNEW it! I sang it into existence!',
        'THE PUDDLES! OH THE PUDDLES!!',
        'I did a rain dance and IT WORKED!!',
        'EVERY DROP IS MY BEST FRIEND!',
      ];
      const text = lines[Math.floor(Math.random() * lines.length)];
      setTimeout(() => {
        import('./ui.js').then(m => m.showMessage(`🐸 "${text}"`, 3500));
      }, delay);
      delay += 4200;
    }

    if (friends.includes('gopher_frog')) {
      const lines = [
        "...It's raining. I came out. Don't make a big deal of it.",
        '*blinks slowly in the rain* ...It\'s nice.',
        '...The dark clouds are nice. Don\'t you think?',
        '...I am wet. This is fine. I\'m fine.',
      ];
      const text = lines[Math.floor(Math.random() * lines.length)];
      setTimeout(() => {
        import('./ui.js').then(m => m.showMessage(`🐸 "${text}"`, 3500));
      }, delay);
    }
  }

  // ── Outdoor wandering friends ────────────────────────────────────────────────

  _spawnOutdoorFriend() {
    const friends = this.save.friendsMovedin || [];
    if (friends.length === 0 || this._outdoorFriends.length >= 1) return;

    const id     = friends[Math.floor(Math.random() * friends.length)];
    const animal = ANIMALS.find(a => a.id === id);
    if (!animal) return;

    const angle = Math.random() * Math.PI * 2;
    const r     = 4 + Math.random() * 5;
    const home  = { x: Math.cos(angle) * r, z: Math.sin(angle) * r };

    const mesh = makeFriendMesh(animal);
    mesh.traverse(obj => { obj.frustumCulled = false; });
    mesh.position.set(home.x, 0.5, home.z);
    this.scene.add(mesh);

    const greeting = animal.greeting[Math.floor(Math.random() * animal.greeting.length)];
    this._outdoorFriends.push({
      animal,
      mesh,
      home,
      wanderAngle: Math.random() * Math.PI * 2,
      lifetime:    0,
      maxLifetime: 55 + Math.random() * 45,
      despawning:  false,
      despawnTimer: 0,
      greeting,
    });
  }

  _updateOutdoorFriends(dt) {
    const isNight  = window._dayNight?.isNight ?? false;
    const inBurrow = this.turtle.isInBurrow;

    // Spawn timer — only during day, when turtle is outside and no recruit is waiting
    if (!isNight && !inBurrow && !this._waiting) {
      this._outdoorTimer -= dt;
      if (this._outdoorTimer <= 0) {
        this._outdoorTimer = 35 + Math.random() * 50;
        this._spawnOutdoorFriend();
      }
    }

    // Update each outdoor friend
    let showBubbleFor  = null;
    let showBubbleDist = GREET_RADIUS + 1;

    this._outdoorFriends = this._outdoorFriends.filter(f => {
      f.lifetime += dt;

      if (!f.despawning && (isNight || f.lifetime >= f.maxLifetime)) {
        f.despawning  = true;
        f.despawnTimer = 0;
      }

      if (f.despawning) {
        f.despawnTimer += dt;
        f.mesh.scale.setScalar(Math.max(0, 1 - f.despawnTimer * 2.5));
        if (f.despawnTimer >= 0.5) {
          this.scene.remove(f.mesh);
          return false;
        }
        return true;
      }

      // Gentle wander around home position
      f.wanderAngle += dt * 0.38;
      const t  = performance.now() / 1000;
      const wx = f.home.x + Math.sin(f.wanderAngle * 0.75) * 2.8;
      const wz = f.home.z + Math.cos(f.wanderAngle * 0.55) * 2.8;
      f.mesh.position.set(wx, 0.5 + Math.abs(Math.sin(t * 1.9)) * 0.12, wz);

      const dist = this.turtle.distanceTo(wx, wz);

      if (dist < GREET_RADIUS) {
        // Turn to face turtle
        const dx      = this.turtle.position.x - wx;
        const dz      = this.turtle.position.z - wz;
        const targetY = Math.atan2(dx, dz);
        let diff      = targetY - f.mesh.rotation.y;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.mesh.rotation.y += diff * Math.min(1, dt * 5);

        if (dist < showBubbleDist) {
          showBubbleDist = dist;
          showBubbleFor  = f;
        }
      } else {
        f.mesh.rotation.y = -f.wanderAngle * 0.7;
      }

      return true;
    });

    // Position outdoor speech bubble over nearest visible friend
    if (showBubbleFor && !inBurrow) {
      const worldPos = showBubbleFor.mesh.position.clone();
      worldPos.y += 1.8;
      worldPos.project(this.turtle.camera);

      if (worldPos.z < 1) {
        const sx = (worldPos.x *  0.5 + 0.5) * window.innerWidth;
        const sy = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
        this._outdoorBubble.textContent  = `${showBubbleFor.animal.emoji} "${showBubbleFor.greeting}"`;
        this._outdoorBubble.style.left      = sx + 'px';
        this._outdoorBubble.style.top       = sy + 'px';
        this._outdoorBubble.style.transform = 'translateX(-50%)';
        this._outdoorBubble.style.display   = 'block';
      } else {
        this._outdoorBubble.style.display = 'none';
      }
    } else {
      this._outdoorBubble.style.display = 'none';
    }
  }

  _scheduleNext() {
    // One friend visit per day
    if (this.save.lastFriendDay === this.save.day) return;

    const moved = this.save.friendsMovedin || [];
    const eligible = ANIMALS.filter(a =>
      !moved.includes(a.id) && this.burrow.level >= a.minLevel
    );
    if (eligible.length === 0) return;
    this._waiting = eligible[0];
    this._spawnWaitingFriend();
  }

  _spawnWaitingFriend() {
    if (!this._waiting) return;
    if (this._waitMesh) this.scene.remove(this._waitMesh);

    // Random position 12–26 units from the burrow, away from the pond area
    const angle = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 14;
    this._waitHome = { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    this._wanderAngle = Math.random() * Math.PI * 2;

    this._waitMesh = makeFriendMesh(this._waiting);
    this._waitMesh.traverse(obj => { obj.frustumCulled = false; });
    this._waitMesh.position.set(this._waitHome.x, 0.5, this._waitHome.z);
    this.scene.add(this._waitMesh);
    this.burrow.showExclamation(true);
  }

  _randomGreeting(id) {
    const animal = ANIMALS.find(a => a.id === id);
    if (!animal) return null;
    return { animal, text: animal.greeting[Math.floor(Math.random() * animal.greeting.length)] };
  }

  update(dt) {
    const friends = this.save.friendsMovedin || [];

    // ── Burrow greeting on entry ──────────────────────────────────────────────
    const inBurrow = this.turtle.isInBurrow;
    if (inBurrow && !this._wasInBurrow && friends.length > 0) {
      const id = friends[Math.floor(Math.random() * friends.length)];
      const g = this._randomGreeting(id);
      if (g) {
        setTimeout(() => {
          const el = document.getElementById('burrowMsg');
          if (el) {
            el.textContent = `${g.animal.emoji} "${g.text}"`;
            setTimeout(() => { if (el.textContent.includes(g.text)) el.textContent = ''; }, 3500);
          }
        }, 300);
      }
    }
    this._wasInBurrow = inBurrow;

    // ── Periodic callouts while outside ──────────────────────────────────────
    if (!inBurrow && friends.length > 0) {
      this._calloutTimer = (this._calloutTimer ?? 25) - dt;
      if (this._calloutTimer <= 0) {
        this._calloutTimer = 40 + Math.random() * 50;
        const id = friends[Math.floor(Math.random() * friends.length)];
        const g = this._randomGreeting(id);
        if (g) import('./ui.js').then(m => m.showMessage(`${g.animal.emoji} "${g.text}"`, 3200));
      }
    }

    this._updateOutdoorFriends(dt);

    if (!this._waiting || !this._waitMesh) return;

    // Wander slowly around spawn point
    this._wanderAngle += dt * 0.35;
    const wx = this._waitHome.x + Math.sin(this._wanderAngle * 0.8) * 3.0;
    const wz = this._waitHome.z + Math.cos(this._wanderAngle * 0.55) * 3.0;
    const t = performance.now() / 1000;
    this._waitMesh.position.set(wx, 0.5 + Math.abs(Math.sin(t * 2)) * 0.15, wz);

    const dist = this.turtle.distanceTo(wx, wz);

    // Face the turtle when close, otherwise face wander direction
    if (dist < GREET_RADIUS) {
      const dx = this.turtle.position.x - wx;
      const dz = this.turtle.position.z - wz;
      const targetY = Math.atan2(dx, dz);
      // Smooth turn toward player
      let diff = targetY - this._waitMesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this._waitMesh.rotation.y += diff * Math.min(1, dt * 6);
    } else {
      this._waitMesh.rotation.y = -this._wanderAngle * 0.8;
    }

    if (dist < GREET_RADIUS) {
      this._speechBubble.textContent = `${this._waiting.emoji} "${this._waiting.invite}"`;

      // Project world position to screen space, offset upward above the animal
      const worldPos = this._waitMesh.position.clone();
      worldPos.y += 1.8;
      worldPos.project(this.turtle.camera);

      if (worldPos.z < 1) {
        const sx = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
        this._speechBubble.style.left = sx + 'px';
        this._speechBubble.style.top = sy + 'px';
        this._speechBubble.style.transform = 'translateX(-50%)';
        this._speechBubble.style.display = 'block';
      } else {
        this._speechBubble.style.display = 'none';
      }
    } else {
      this._speechBubble.style.display = 'none';
    }

    if (dist < ACCEPT_RADIUS) {
      this._acceptFriend();
    }
  }

  _acceptFriend() {
    const animal = this._waiting;
    if (!animal) return;

    this.save.friendsMovedin = this.save.friendsMovedin || [];
    this.save.friendsMovedin.push(animal.id);
    this.save.lastFriendDay = this.save.day;
    this.save.save();

    this.scene.remove(this._waitMesh);
    this._waitMesh = null;
    this._waiting = null;
    this._speechBubble.style.display = 'none';

    this.audio.play('friend');
    this.burrow.showArrivalFanfare(animal);
    this.burrow.showExclamation(false);

    // Check if Full House
    if (this.save.friendsMovedin.length >= ANIMALS.length) {
      setTimeout(() => {
        this.showMessage('🎊 Full House! All friends are home! 🎊', 5000);
        this._confetti();
      }, 4000);
    }
  }

  _confetti() {
    const confettiEl = document.createElement('div');
    confettiEl.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden;`;
    document.body.appendChild(confettiEl);
    const colors = ['#f4c460','#ff6b6b','#5bc5f2','#77cc55','#cc5599'];
    for (let i = 0; i < 80; i++) {
      const dot = document.createElement('div');
      const c = colors[Math.floor(Math.random() * colors.length)];
      dot.style.cssText = `
        position:absolute; width:10px; height:10px;
        background:${c}; border-radius:50%;
        left:${Math.random()*100}vw; top:-20px;
        animation:fall ${1.5+Math.random()*2}s linear ${Math.random()*2}s forwards;
      `;
      confettiEl.appendChild(dot);
    }
    const style = document.createElement('style');
    style.textContent = `@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}`;
    document.head.appendChild(style);
    setTimeout(() => { confettiEl.remove(); style.remove(); }, 6000);
  }

  getFriendGreeting(id) {
    const animal = ANIMALS.find(a => a.id === id);
    if (!animal) return '';
    const greetings = animal.greeting;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Called when burrow levels up — re-check for newly eligible friends
  onBurrowUpgrade() {
    if (!this._waiting) this._scheduleNext();
  }
}
