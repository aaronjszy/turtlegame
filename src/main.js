import * as THREE from 'three';
import { World } from './world.js';
import { Turtle } from './turtle.js';
import { HUD } from './hud.js';
import { DayNight } from './daynight.js';
import { FoodSystem } from './food.js';
import { BaskingSystem } from './basking.js';
import { Burrow } from './burrow.js';
import { AnimalFriends } from './animals.js';
import { Hawk } from './predator.js';
import { Raccoon } from './raccoon.js';
import { SaveSystem } from './save.js';
import { Audio } from './audio.js';
import { showMessage, showDaySummary, initUI, initOnboarding } from './ui.js';
import { Fireflies } from './fireflies.js';
import { PondSystem } from './pond.js';
import { ParticleSystem } from './particles.js';
import { GoalSystem } from './goals.js';
import { RainSystem } from './rain.js';

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.insertBefore(renderer.domElement, document.getElementById('hud'));

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 40, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

// ── Wait for name entry ───────────────────────────────────────────────────────
const overlay = document.getElementById('overlay');
const nameInput = document.getElementById('nameInput');
const nameSubmit = document.getElementById('nameSubmit');

// Check for an existing save and offer to continue
const _existingSave = (() => {
  try { return JSON.parse(localStorage.getItem('turtlegame_save')); } catch { return null; }
})();
if (_existingSave?.name) {
  nameInput.value = _existingSave.name;
  document.querySelector('#overlay p').textContent = `Welcome back, ${_existingSave.name}! 🐢`;
  nameSubmit.textContent = 'Continue!';

  const newBtn = document.createElement('button');
  newBtn.textContent = 'New Game';
  newBtn.style.cssText = nameSubmit.style.cssText +
    ';font-family:inherit;font-size:16px;padding:8px 18px;border-radius:12px;border:none;' +
    'background:rgba(255,255,255,0.15);color:#fff8e1;cursor:pointer;margin-left:8px;';
  nameSubmit.after(newBtn);

  newBtn.addEventListener('click', () => {
    localStorage.removeItem('turtlegame_save');
    nameInput.value = '';
    document.querySelector('#overlay p').textContent = 'What will you name your turtle?';
    nameSubmit.textContent = "Let's go!";
    newBtn.remove();
    nameInput.focus();
  });
} else {
  nameInput.focus();
}

function startGame(name) {
  overlay.style.display = 'none';

  const save = new SaveSystem(name);
  const audio = new Audio();
  const dayNight = new DayNight(scene, save);
  const world = new World(scene, save.name);
  const turtle = new Turtle(scene, camera, save, world.colliders, world.groundMeshes);
  const hud = new HUD(save);
  const food = new FoodSystem(scene, turtle, save, audio);
  const basking = new BaskingSystem(scene, turtle, save, dayNight, audio);
  const burrow = new Burrow(scene, turtle, save, audio);
  const animals = new AnimalFriends(scene, turtle, burrow, save, audio, showMessage);
  const hawk = new Hawk(scene, turtle, save, audio, showMessage, hud);
  const raccoon = new Raccoon(scene, turtle, burrow, audio);

  const fireflies = new Fireflies(scene);
  const pond = new PondSystem(turtle, save, audio);
  const particles = new ParticleSystem(scene);
  const goals = new GoalSystem(save, turtle, audio);
  const rain = new RainSystem(scene, dayNight, animals);

  food._particles = particles;
  burrow.onDigCallback = () => goals.notifyDig();

  window._food = food;

  initUI(save, burrow, animals, dayNight, audio, showMessage, showDaySummary, goals);
  initOnboarding(save);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);

    rain.update(dt, turtle);
    dayNight.rainAmount = rain.rainAmount;
    dayNight.update(dt);
    turtle.update(dt);
    food.update(dt);
    basking.update(dt);
    burrow.update(dt);
    animals.update(dt);
    hawk.update(dt);
    raccoon.update(dt);
    pond.update(dt);
    fireflies.update(dt);
    particles.update(dt);
    goals.update(dt);
    hud.update();

    renderer.render(scene, camera);
  }

  animate();
}

nameSubmit.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'Dave';
  startGame(name);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = nameInput.value.trim() || 'Dave';
    startGame(name);
  }
});
