import * as THREE from 'three';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

const characters = [
  {file:'basil.glb', clip:'preset:biped:cheer', x:-1.12, height:2.25, angle:.12, phase:.7},
  {file:'tania.glb', clip:'wave_goodbye_02', x:0, height:2.12, angle:0, phase:.15},
  {file:'andrew.glb', clip:'preset:biped:wave_goodbye_02', x:1.12, height:2.32, angle:-.12, phase:1.2},
];

export async function mountGreeters(canvas, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  camera.position.set(0, 1.42, 8);
  camera.lookAt(0, 1.42, 0);
  scene.add(new THREE.HemisphereLight(0xfff6de, 0x91abc0, 2.25));
  const key = new THREE.DirectionalLight(0xfff3dc, 2);
  key.position.set(-3, 5, 5);
  scene.add(key);

  const loader = new GLTFLoader();
  const mixers = await Promise.all(characters.map(async character => {
    const {scene: model, animations} = await loader.loadAsync(new URL(character.file, import.meta.url).href);
    const clip = animations.find(animation => animation.name === character.clip);
    if (!clip) throw new Error(`Missing greeting animation in ${character.file}`);
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(clip).play();
    mixer.update(0);
    const bounds = new THREE.Box3().setFromObject(model, true);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = character.height / (bounds.max.y - bounds.min.y);
    const stand = new THREE.Group();
    stand.position.x = character.x;
    stand.rotation.y = character.angle;
    stand.scale.setScalar(scale);
    model.position.x -= center.x;
    model.position.y -= bounds.min.y;
    model.position.z -= center.z;
    stand.add(model);
    scene.add(stand);
    action.time = character.phase;
    mixer.update(0);
    return mixer;
  }));

  function draw() {
    const {clientWidth: width, clientHeight: height} = canvas;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.48, 2.05 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  let frame = 0;
  let previousTime = 0;
  let visible = false;
  function animate(time) {
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    mixers.forEach(mixer => mixer.update(delta));
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  new ResizeObserver(draw).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(canvas);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  draw();
  canvas.dataset.ready = 'true';
}
