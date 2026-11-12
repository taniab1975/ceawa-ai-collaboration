import * as THREE from 'three';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

const characters = [
  {file:'basil-sleeves.glb', clip:'preset:biped:agree', x:-1.12, height:2.25, angle:.12, phase:1.4},
  {file:'tania-smile.glb', clip:'wave_goodbye_02', x:0, height:2.12, angle:0, phase:3.52},
  {file:'andrew.glb', clip:'preset:biped:wave_goodbye_02', x:1.12, height:2.32, angle:-.12, phase:3.55},
];

export async function mountGreeters(canvas, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  camera.position.set(0, 1.22, 8);
  camera.lookAt(0, 1.22, 0);
  scene.add(new THREE.HemisphereLight(0xfff6de, 0x91abc0, 2.25));
  const key = new THREE.DirectionalLight(0xfff3dc, 2);
  key.position.set(-3, 5, 5);
  scene.add(key);

  const loader = new GLTFLoader();
  const cast = await Promise.all(characters.map(async character => {
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
    return {model, mixer, action, duration:clip.duration};
  }));

  const [, tania, andrew] = cast;
  tania.action.timeScale = tania.duration / andrew.duration;
  const armSegments = ['Left', 'Right'].flatMap((side, index) => {
    const prefix = index === 0 ? 'L' : 'R';
    return [
      [side + 'Arm', side + 'ForeArm', prefix + '_Upperarm', prefix + '_Forearm'],
      [side + 'ForeArm', side + 'Hand', prefix + '_Forearm', prefix + '_Hand'],
    ];
  }).map(([joint, child, referenceJoint, referenceChild]) => ({
    joint: tania.model.getObjectByName('mixamorig' + joint),
    child: tania.model.getObjectByName('mixamorig' + child),
    referenceJoint: andrew.model.getObjectByName(referenceJoint),
    referenceChild: andrew.model.getObjectByName(referenceChild),
  }));
  const worldStart = new THREE.Vector3();
  const worldEnd = new THREE.Vector3();
  const target = new THREE.Vector3();
  const current = new THREE.Vector3();
  const correction = new THREE.Quaternion();
  const parentRotation = new THREE.Quaternion();
  const partialCorrection = new THREE.Quaternion();

  // Match the wave's shoulder and elbow directions across the two rigs.
  // Keep Tania's native hand, torso and finger animation.
  function matchWave() {
    for (const {joint, child, referenceJoint, referenceChild} of armSegments) {
      referenceChild.getWorldPosition(worldEnd);
      referenceJoint.getWorldPosition(worldStart);
      target.subVectors(worldEnd, worldStart).normalize();
      child.getWorldPosition(worldEnd);
      joint.getWorldPosition(worldStart);
      current.subVectors(worldEnd, worldStart).normalize();
      joint.parent.getWorldQuaternion(parentRotation).invert();
      target.applyQuaternion(parentRotation);
      current.applyQuaternion(parentRotation);
      correction.setFromUnitVectors(current, target);
      partialCorrection.identity().slerp(correction, .65);
      joint.quaternion.premultiply(partialCorrection);
    }
  }
  matchWave();

  function draw() {
    const {clientWidth: width, clientHeight: height} = canvas;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.35, 1.9 / aspect);
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
    cast.forEach(({mixer}) => mixer.update(delta));
    matchWave();
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
  canvas.removeAttribute('aria-hidden');
}
