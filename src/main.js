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
import { showMessage, showDaySummary, initUI, initOnboarding, checkGrowth } from './ui.js';
import { getSaveList, exportSave, importSave } from './save.js';
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
scene.fog = new THREE.Fog(0x87ceeb, 55, 165);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

// ── Save picker / name entry ───────────────────────────────────────────────────
const overlay = document.getElementById('overlay');
const STAGE_NAMES = ['Hatchling', 'Small Turtle', 'Juvenile', 'Young Adult', 'Adult', 'Elder Tortoise'];

function showSavePicker() {
  const saves = getSaveList();
  overlay.innerHTML = `
    <h1>🐢 Baby Gopher Tortoise</h1>
    <p>${saves.length ? 'Choose your turtle:' : 'No turtles yet!'}</p>
    <div id="saveSlots">
      ${saves.map(s => `
        <div class="saveSlotRow">
          <button class="saveSlot" data-name="${s.name}">
            🐢 ${s.name}
            <small>Day ${s.day} &nbsp;·&nbsp; ${STAGE_NAMES[s.growthStage] ?? 'Hatchling'}</small>
          </button>
          <button class="exportBtn" data-name="${s.name}" title="Export save file">💾</button>
        </div>
      `).join('')}
      <button id="newTurtleBtn">+ New Turtle</button>
      <button id="importSaveBtn">📂 Import Save</button>
      <input type="file" id="importFileInput" accept=".json" style="display:none">
    </div>
  `;
  overlay.querySelectorAll('.saveSlot').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.name));
  });
  overlay.querySelectorAll('.exportBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      exportSave(btn.dataset.name);
    });
  });
  document.getElementById('newTurtleBtn').addEventListener('click', showNameInput);
  document.getElementById('importSaveBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const name = importSave(ev.target.result);
      if (name) {
        showSavePicker();
      } else {
        alert('Could not import save — file may be invalid.');
      }
    };
    reader.readAsText(file);
  });
}

function showNameInput() {
  const hasSaves = getSaveList().length > 0;
  overlay.innerHTML = `
    <h1>🐢 Baby Gopher Tortoise</h1>
    <p>What will you name your turtle?</p>
    <div id="nameForm">
      <input id="nameInput" type="text" maxlength="20" placeholder="Dave..." autocomplete="off" />
      <button id="nameSubmit">Let's go!</button>
      ${hasSaves ? '<button id="backBtn">← Back</button>' : ''}
    </div>
  `;
  const nameInput = document.getElementById('nameInput');
  nameInput.focus();
  document.getElementById('nameSubmit').addEventListener('click', () => {
    startGame(nameInput.value.trim() || 'Dave');
  });
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startGame(nameInput.value.trim() || 'Dave');
  });
  document.getElementById('backBtn')?.addEventListener('click', showSavePicker);
}

showSavePicker();

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
  checkGrowth(showMessage);

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

