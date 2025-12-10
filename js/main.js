// ========== main.js - 완전 수정 버전 ==========

// 상태 관리
let scene, camera, renderer, controls;
let raycaster, mouse;
let lpObjects = [];
let shelfObjects = [];
let selectedLP = null;
let isTransitioning = false;
let isDetailView = false;
let autoPlayTimer = null;
let progressInterval = null;

// 프로젝트 데이터
const projects = [
{
id: 1,
name: 'National Museum of Korea',
type: 'Team Project',
thumbnail: '../assets/images/playlist_sum_01.png',
bgImage: '../assets/images/lp1-bg.png',
overview: '국립중앙박물관 프로젝트입니다. 한국의 역사와 문화를 디지털 경험으로 재해석했습니다.'
},
{
id: 2,
name: 'Wellio',
type: 'Team Project',
thumbnail: '../assets/images/playlist_sum_02.png',
bgImage: '../assets/images/lp2-bg.png',
overview: 'Wellio 프로젝트입니다. 웰빙 라이프스타일을 위한 통합 플랫폼을 디자인했습니다.'
},
{
id: 3,
name: 'KICO',
type: 'Team Project',
thumbnail: '../assets/images/playlist_sum_03.png',
bgImage: '../assets/images/lp3-bg.png',
overview: 'KICO 프로젝트입니다. 혁신적인 서비스 경험을 제공합니다.'
},
{
id: 4,
name: 'Re:bubble',
type: 'Team Project',
thumbnail: '../assets/images/playlist_sum_04.png',
bgImage: '../assets/images/lp4-bg.png',
overview: 'Re:bubble 프로젝트입니다. 버블에 담긴 나만의 스토리를 만들어갑니다.'
},
{
id: 5,
name: 'ER',
type: 'Personal Project',
thumbnail: '../assets/images/playlist_sum_05.png',
bgImage: '../assets/images/lp5-bg.png',
overview: 'ER 프로젝트입니다. 개인 프로젝트로 진행한 작업입니다.'
},
{
id: 6,
name: 'Orion',
type: 'Personal Project',
thumbnail: '../assets/images/playlist_sum_06.png',
bgImage: '../assets/images/lp6-bg.png',
overview: 'Orion 프로젝트입니다. 우주를 테마로 한 인터랙티브 경험을 제공합니다.'
}
];

// ========== 페이지 로드 시 실행 ==========
window.addEventListener('load', () => {
document.body.style.overflow = 'hidden';
init3DScene();
initPlaylist();
});

// ========== 플레이리스트 초기화 ==========
function initPlaylist() {
const playlistItems = document.getElementById('playlistItems');
if (!playlistItems) return;

playlistItems.innerHTML = projects.map(p => `
<li class="playlist-item" onclick="handlePlaylistClick(${p.id})">
<img src="${p.thumbnail}" alt="${p.name}">
<div class="playlist-item-info">
<div class="playlist-item-name">${p.name}</div>
<div class="playlist-item-type">${p.type}</div>
</div>
</li>
`).join('');
}

// ========== 플레이리스트 아이템 클릭 ==========
function handlePlaylistClick(projectId) {
const lpData = lpObjects.find(lp => lp.id === projectId);
if (lpData) {
handleLPClick(lpData);
}
}

// ========== 플레이리스트 / NOW PLAYING 전환 ==========
window.togglePlaylistView = function() {
const playlistView = document.getElementById('playlistView');
const nowPlayingView = document.getElementById('nowPlayingView');

if (!selectedLP) return;

isDetailView = !isDetailView;
if (isDetailView) {
const project = projects.find(p => p.id === selectedLP.id);
updateDetailView(project);
playlistView.style.display = 'none';
nowPlayingView.style.display = 'flex';
} else {
const project = projects.find(p => p.id === selectedLP.id);
updatePlayingNextView(project);
playlistView.style.display = 'none';
nowPlayingView.style.display = 'flex';
}
}

// ========== 초기화 ==========
function init3DScene() {
const container = document.getElementById('lp-drawer');
if (!container) return;

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
// 초기 각도 조정: 오른쪽 위에서 보는 각도
camera.position.set(4, 3, 4);

renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.innerHTML = '';
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;

raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

loadGLTFModel();

window.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('click', onMouseClick);
window.addEventListener('resize', onWindowResize);

animate();
}

// ========== 채도 감소 함수 ==========
function reduceSaturation(object) {
object.traverse((child) => {
if (child.isMesh && child.material) {
const materials = Array.isArray(child.material) ? child.material : [child.material];
materials.forEach(mat => {
if (mat.color) {
const hsl = {};
mat.color.getHSL(hsl);
mat.color.setHSL(hsl.h, hsl.s * 0.3, hsl.l);
}
});
}
});
}

// ========== GLTF 모델 로드 ==========
function loadGLTFModel() {
const loader = new THREE.GLTFLoader();
loader.load('../assets/LP.glb', function(gltf) {
const model = gltf.scene;
scene.add(model);

model.traverse((child) => {
if (child.isMesh) {
child.castShadow = true;
child.receiveShadow = true;
}
});

const foundLPs = [];
const foundVinyls = [];

model.traverse((child) => {
const nameLower = child.name.toLowerCase();
if (nameLower.includes('lp') && nameLower.includes('cover')) {
const idMatch = child.name.match(/\d+/);
if (idMatch) {
foundLPs.push({ mesh: child, id: parseInt(idMatch[0]), name: child.name });
}
}
if (nameLower.includes('vinyl')) {
const idMatch = child.name.match(/\d+/);
if (idMatch) {
foundVinyls.push({ mesh: child, id: parseInt(idMatch[0]), name: child.name });
}
}
});

foundLPs.forEach(lpData => {
const matchedVinyl = foundVinyls.find(v => v.id === lpData.id);
reduceSaturation(lpData.mesh);
if (matchedVinyl) reduceSaturation(matchedVinyl.mesh);
lpObjects.push({
mesh: lpData.mesh,
vinyl: matchedVinyl ? matchedVinyl.mesh : null,
originalPosition: lpData.mesh.position.clone(),
originalRotation: lpData.mesh.rotation.clone(),
originalScale: lpData.mesh.scale.clone(),
vinylOriginalPosition: matchedVinyl ? matchedVinyl.mesh.position.clone() : null,
vinylOriginalRotation: matchedVinyl ? matchedVinyl.mesh.rotation.clone() : null,
vinylOriginalScale: matchedVinyl ? matchedVinyl.mesh.scale.clone() : null,
id: lpData.id
});
});

model.traverse((child) => {
const nameLower = child.name.toLowerCase();
if (child.name === 'Cube' || nameLower.includes('cylinder') || nameLower.includes('shelf')) {
reduceSaturation(child);
shelfObjects.push({ mesh: child, originalPosition: child.position.clone() });
}
});

lpObjects.sort((a, b) => a.id - b.id);
});
}

// ========== 마우스 이벤트 ==========
function onMouseMove(event) {
const container = document.getElementById('lp-drawer');
if (!container) return;

const rect = container.getBoundingClientRect();
mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseClick(event) {
if (isTransitioning || selectedLP) return;

raycaster.setFromCamera(mouse, camera);
const lpMeshes = lpObjects.map(lp => lp.mesh);
const intersects = raycaster.intersectObjects(lpMeshes, true);

if (intersects.length > 0) {
const clickedObject = intersects[0].object;
let clickedLP = null;
let checkObject = clickedObject;
for (let i = 0; i < 5; i++) {
clickedLP = lpObjects.find(lp => lp.mesh === checkObject);
if (clickedLP) break;
if (checkObject.parent) checkObject = checkObject.parent;
else break;
}
if (clickedLP) handleLPClick(clickedLP);
}
}

// ========== LP 클릭 핸들러 ==========
function handleLPClick(lpData) {
if (isTransitioning) return;

isTransitioning = true;
selectedLP = lpData;
isDetailView = false;
controls.enabled = false;

const duration = 1000;
const startTime = Date.now();

const cameraStartPos = camera.position.clone();
const cameraTargetPos = new THREE.Vector3(0, 0, 4.2);

const lookAtStart = new THREE.Vector3(0, 0, 0);
const lookAtTarget = new THREE.Vector3(0, 0, 0);

const selectedCoverStartPos = lpData.mesh.position.clone();
const selectedCoverTargetPos = new THREE.Vector3(-0.4, 0, 0);

const startRotationY = lpData.mesh.rotation.y;
const targetRotationY = lpData.originalRotation.y - Math.PI / 2;

const startRotationX = lpData.mesh.rotation.x;
const targetRotationX = -3 * (Math.PI / 180);

const selectedVinylStartPos = lpData.vinyl ? lpData.vinyl.position.clone() : null;
const selectedVinylTargetPos = lpData.vinyl ? new THREE.Vector3(0.9, 0, 0.05) : null;

const vinylStartRotationY = lpData.vinyl ? lpData.vinyl.rotation.y : 0;
const vinylTargetRotationY = (lpData.vinylOriginalRotation ? lpData.vinylOriginalRotation.y : 0) - Math.PI / 2;

const vinylStartRotationX = lpData.vinyl ? lpData.vinyl.rotation.x : 0;
const vinylTargetRotationX = -3 * (Math.PI / 180);

const targetScale = 1.92;

const shelfStartPositions = shelfObjects.map(obj => obj.mesh.position.clone());
const otherLPsStartPos = lpObjects.filter(lp => lp.id !== lpData.id).map(lp => ({
lp: lp,
coverStartPos: lp.mesh.position.clone(),
vinylStartPos: lp.vinyl ? lp.vinyl.position.clone() : null
}));

function animateLP() {
const elapsed = Date.now() - startTime;
const progress = Math.min(elapsed / duration, 1);
const eased = 1 - Math.pow(1 - progress, 3);

camera.position.lerpVectors(cameraStartPos, cameraTargetPos, eased);
const currentLookAt = new THREE.Vector3().lerpVectors(lookAtStart, lookAtTarget, eased);
camera.lookAt(currentLookAt);

lpData.mesh.position.lerpVectors(selectedCoverStartPos, selectedCoverTargetPos, eased);
lpData.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
lpData.mesh.rotation.y = startRotationY + (targetRotationY - startRotationY) * eased;
lpData.mesh.rotation.x = startRotationX + (targetRotationX - startRotationX) * eased;

if (lpData.vinyl && selectedVinylStartPos && selectedVinylTargetPos) {
lpData.vinyl.position.lerpVectors(selectedVinylStartPos, selectedVinylTargetPos, eased);
lpData.vinyl.scale.setScalar(1 + (targetScale - 1) * eased);
lpData.vinyl.rotation.y = vinylStartRotationY + (vinylTargetRotationY - vinylStartRotationY) * eased;
lpData.vinyl.rotation.x = vinylStartRotationX + (vinylTargetRotationX - vinylStartRotationX) * eased;
}

shelfObjects.forEach((shelfObj, index) => {
const targetPos = shelfStartPositions[index].clone();
targetPos.z += 10;
shelfObj.mesh.position.lerpVectors(shelfStartPositions[index], targetPos, eased);
});

otherLPsStartPos.forEach(item => {
const coverTarget = item.coverStartPos.clone();
coverTarget.z += 10;
item.lp.mesh.position.lerpVectors(item.coverStartPos, coverTarget, eased);

if (item.lp.vinyl && item.vinylStartPos) {
const vinylTarget = item.vinylStartPos.clone();
vinylTarget.z += 10;
item.lp.vinyl.position.lerpVectors(item.vinylStartPos, vinylTarget, eased);
}
});

if (progress < 1) {
requestAnimationFrame(animateLP);
} else {
isTransitioning = false;
const project = projects.find(p => p.id === lpData.id);
updatePlayingNextView(project);
startAutoPlay();
}
}

animateLP();
}

// ========== 8초 자동 재생 시작 ==========
function startAutoPlay() {
stopAutoPlay();
const progressFill = document.querySelector('.progress-fill');
if (!progressFill) return;
progressFill.style.width = '0%';
let startTime = Date.now();
const duration = 8000;
progressInterval = setInterval(() => {
const elapsed = Date.now() - startTime;
const progress = Math.min((elapsed / duration) * 100, 100);
progressFill.style.width = progress + '%';
if (progress >= 100) {
stopAutoPlay();
}
}, 50);
autoPlayTimer = setTimeout(() => {
playNext();
}, duration);
}

// ========== 자동 재생 중지 ==========
function stopAutoPlay() {
if (autoPlayTimer) {
clearTimeout(autoPlayTimer);
autoPlayTimer = null;
}
if (progressInterval) {
clearInterval(progressInterval);
progressInterval = null;
}
}

// ========== 2박스 디테일 뷰 업데이트 ==========
function updateDetailView(project) {
const playlistView = document.getElementById('playlistView');
const nowPlayingView = document.getElementById('nowPlayingView');
const nowPlayingCard = document.getElementById('nowPlayingCard');
const playingNextSection = document.getElementById('playingNextSection');
if (!nowPlayingCard || !playingNextSection) return;

changeBackground(project.bgImage);

nowPlayingCard.innerHTML = `
<div class="now-playing-header">
<img src="${project.thumbnail}" alt="${project.name}">
<div class="now-playing-info">
<div class="now-playing-name">${project.name}</div>
<div class="now-playing-type">${project.type}</div>
</div>
</div>
<div class="playback-bar">
<div class="progress-container">
<div class="progress-fill"></div>
</div>
<div class="time-display">
<span>24.09.01</span>
<span>24.12.15</span>
</div>
</div>
<div class="playback-controls">
<button class="control-btn prev" onclick="playPrevious()">⏮</button>
<button class="control-btn play-pause" onclick="togglePlay()">⏸</button>
<button class="control-btn next" onclick="playNext()">⏭</button>
</div>
`;

playingNextSection.innerHTML = `
<h3>OVERVIEW</h3>
<div class="content-tabs">
<div class="content-tab active" onclick="switchContentTab('overview', ${project.id})">Overview</div>
<div class="content-tab" onclick="switchContentTab('landing', ${project.id})">Landing Page</div>
<div class="content-tab" onclick="switchContentTab('prototype', ${project.id})">Prototype</div>
</div>
<div class="content-display" id="contentDisplay">
${project.overview}
</div>
`;

if (playlistView) playlistView.style.display = 'none';
if (nowPlayingView) nowPlayingView.style.display = 'flex';
startAutoPlay();
}

// ========== 1박스 PLAYING NEXT 뷰 업데이트 ==========
function updatePlayingNextView(project) {
const playlistView = document.getElementById('playlistView');
const nowPlayingView = document.getElementById('nowPlayingView');
const nowPlayingCard = document.getElementById('nowPlayingCard');
const playingNextSection = document.getElementById('playingNextSection');
if (!nowPlayingCard || !playingNextSection) return;

changeBackground(project.bgImage);

nowPlayingCard.innerHTML = `
<div class="now-playing-header">
<img src="${project.thumbnail}" alt="${project.name}">
<div class="now-playing-info">
<div class="now-playing-name">${project.name}</div>
<div class="now-playing-type">${project.type}</div>
</div>
</div>
<div class="playback-bar">
<div class="progress-container">
<div class="progress-fill"></div>
</div>
<div class="time-display">
<span>24.09.01</span>
<span>24.12.15</span>
</div>
</div>
<div class="playback-controls">
<button class="control-btn prev" onclick="playPrevious()">⏮</button>
<button class="control-btn play-pause" onclick="togglePlay()">⏸</button>
<button class="control-btn next" onclick="playNext()">⏭</button>
</div>
`;

playingNextSection.innerHTML = `
<h3>PLAYING NEXT</h3>
<div class="playing-next-list">
${projects
.filter(p => p.id !== project.id)
.map(p => `
<div class="playing-next-item" onclick="switchToProject(${p.id})">
<img src="${p.thumbnail}" alt="${p.name}">
<div class="playing-next-info">
<div class="playing-next-name">${p.name}</div>
<div class="playing-next-type">${p.type}</div>
</div>
</div>
`).join('')}
</div>
`;

if (playlistView) playlistView.style.display = 'none';
if (nowPlayingView) nowPlayingView.style.display = 'flex';
startAutoPlay();
}

// ========== 컨텐츠 탭 전환 ==========
window.switchContentTab = function(type, projectId) {
const tabs = document.querySelectorAll('.content-tab');
const display = document.getElementById('contentDisplay');
const project = projects.find(p => p.id === projectId);
if (!display || !project) return;

tabs.forEach(tab => tab.classList.remove('active'));
event.target.classList.add('active');

if (type === 'overview') {
display.textContent = project.overview;
} else if (type === 'landing') {
display.textContent = 'Landing Page 컨텐츠가 여기에 표시됩니다.';
} else if (type === 'prototype') {
display.textContent = 'Prototype 컨텐츠가 여기에 표시됩니다.';
}
}

// ========== 재생 컨트롤 함수들 ==========
window.togglePlay = function() {
const btn = event.target;
if (btn.textContent === '⏸') {
btn.textContent = '▶';
stopAutoPlay();
} else {
btn.textContent = '⏸';
startAutoPlay();
}
}

window.playPrevious = function() {
if (!selectedLP) return;
const currentIndex = projects.findIndex(p => p.id === selectedLP.id);
const prevIndex = currentIndex > 0 ? currentIndex - 1 : projects.length - 1;
switchToProject(projects[prevIndex].id);
}

window.playNext = function() {
if (!selectedLP) return;
const currentIndex = projects.findIndex(p => p.id === selectedLP.id);
const nextIndex = (currentIndex + 1) % projects.length;
switchToProject(projects[nextIndex].id);
}

// ========== 다른 프로젝트로 전환 ==========
window.switchToProject = function(projectId) {
if (isTransitioning || !selectedLP) return;
const newLP = lpObjects.find(lp => lp.id === projectId);
const currentLP = lpObjects.find(lp => lp.id === selectedLP.id);
if (!newLP || !currentLP) return;

stopAutoPlay();
isTransitioning = true;
const duration = 800;
const startTime = Date.now();

const currentCoverPos = currentLP.mesh.position.clone();
const currentVinylPos = currentLP.vinyl ? currentLP.vinyl.position.clone() : null;
const currentScale = currentLP.mesh.scale.x;

const currentRotY = currentLP.mesh.rotation.y;
const currentRotX = currentLP.mesh.rotation.x;

const currentVinylRotY = currentLP.vinyl ? currentLP.vinyl.rotation.y : 0;
const currentVinylRotX = currentLP.vinyl ? currentLP.vinyl.rotation.x : 0;

const currentTargetRotY = currentLP.originalRotation.y;
const currentTargetRotX = currentLP.originalRotation.x;

const currentTargetPos = currentLP.originalPosition.clone();
currentTargetPos.z += 10;

const newCoverStartPos = newLP.originalPosition.clone();
newCoverStartPos.z += 10;

const newStartRotY = newLP.originalRotation.y;
const newStartRotX = newLP.originalRotation.x;

const targetPos = new THREE.Vector3(-0.4, 0, 0);
const targetRotY = newLP.originalRotation.y - Math.PI / 2;
const targetRotX = -3 * (Math.PI / 180);

const targetScale = 1.92;

const vinylTargetPos = new THREE.Vector3(0.9, 0, 0.05);
const vinylTargetRotY = (newLP.vinylOriginalRotation ? newLP.vinylOriginalRotation.y : 0) - Math.PI / 2;
const vinylTargetRotX = -3 * (Math.PI / 180);

function animateSwitch() {
const elapsed = Date.now() - startTime;
const progress = Math.min(elapsed / duration, 1);
const eased = 1 - Math.pow(1 - progress, 3);
currentLP.mesh.position.lerpVectors(currentCoverPos, currentTargetPos, eased);
currentLP.mesh.scale.setScalar(currentScale - (currentScale - 1) * eased);
currentLP.mesh.rotation.y = currentRotY + (currentTargetRotY - currentRotY) * eased;
currentLP.mesh.rotation.x = currentRotX + (currentTargetRotX - currentRotX) * eased;
if (currentLP.vinyl && currentVinylPos) {
const vinOrig = currentLP.vinylOriginalPosition.clone();
vinOrig.z += 10;
currentLP.vinyl.position.lerpVectors(currentVinylPos, vinOrig, eased);
const vinOrigRot = currentLP.vinylOriginalRotation ? currentLP.vinylOriginalRotation.y : 0;
currentLP.vinyl.rotation.y = currentVinylRotY + (vinOrigRot - currentVinylRotY) * eased;
const vinOrigRotX = currentLP.vinylOriginalRotation ? currentLP.vinylOriginalRotation.x : 0;
currentLP.vinyl.rotation.x = currentVinylRotX + (vinOrigRotX - currentVinylRotX) * eased;
currentLP.vinyl.scale.setScalar(currentScale - (currentScale - 1) * eased);
}
newLP.mesh.position.lerpVectors(newCoverStartPos, targetPos, eased);
newLP.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
newLP.mesh.rotation.y = newStartRotY + (targetRotY - newStartRotY) * eased;
newLP.mesh.rotation.x = newStartRotX + (targetRotX - newStartRotX) * eased;
if (newLP.vinyl) {
const vinStart = newLP.vinylOriginalPosition ? newLP.vinylOriginalPosition.clone() : new THREE.Vector3();
vinStart.z += 10;
newLP.vinyl.position.lerpVectors(vinStart, vinylTargetPos, eased);
newLP.vinyl.scale.setScalar(1 + (targetScale - 1) * eased);
const vinStartRot = newLP.vinylOriginalRotation ? newLP.vinylOriginalRotation.y : 0;
newLP.vinyl.rotation.y = vinStartRot + (vinylTargetRotY - vinStartRot) * eased;
const vinStartRotX = newLP.vinylOriginalRotation ? newLP.vinylOriginalRotation.x : 0;
newLP.vinyl.rotation.x = vinStartRotX + (vinylTargetRotX - vinStartRotX) * eased;
}
if (progress < 1) {
requestAnimationFrame(animateSwitch);
} else {
isTransitioning = false;
selectedLP = newLP;
const project = projects.find(p => p.id === projectId);
if (isDetailView) {
updateDetailView(project);
} else {
updatePlayingNextView(project);
}
}
}

animateSwitch();
}

// ========== LP 닫기 ==========
window.closeLPView = function() {
if (isTransitioning || !selectedLP) return;
stopAutoPlay();
isTransitioning = true;
const duration = 800;
const startTime = Date.now();

const cameraCurrentPos = camera.position.clone();
const cameraOriginalPos = new THREE.Vector3(4, 3, 4);
const lookAtTarget = new THREE.Vector3(0, 0, 0);

const currentPositions = lpObjects.map(lpData => ({
coverPos: lpData.mesh.position.clone(),
vinylPos: lpData.vinyl ? lpData.vinyl.position.clone() : null,
coverScale: lpData.mesh.scale.x,
vinylScale: lpData.vinyl ? lpData.vinyl.scale.x : 1,
coverRot: lpData.mesh.rotation.y,
coverRotX: lpData.mesh.rotation.x,
vinylRot: lpData.vinyl ? lpData.vinyl.rotation.y : 0,
vinylRotX: lpData.vinyl ? lpData.vinyl.rotation.x : 0
}));

const shelfCurrentPositions = shelfObjects.map(obj => obj.mesh.position.clone());

function animateBack() {
const elapsed = Date.now() - startTime;
const progress = Math.min(elapsed / duration, 1);
const eased = 1 - Math.pow(1 - progress, 3);
camera.position.lerpVectors(cameraCurrentPos, cameraOriginalPos, eased);
camera.lookAt(lookAtTarget);
lpObjects.forEach((lpData, index) => {
lpData.mesh.position.lerpVectors(currentPositions[index].coverPos, lpData.originalPosition, eased);
const currentScale = currentPositions[index].coverScale;
lpData.mesh.scale.setScalar(currentScale - (currentScale - 1) * eased);
lpData.mesh.rotation.y = currentPositions[index].coverRot + (lpData.originalRotation.y - currentPositions[index].coverRot) * eased;
lpData.mesh.rotation.x = currentPositions[index].coverRotX + (lpData.originalRotation.x - currentPositions[index].coverRotX) * eased;
if (lpData.vinyl && lpData.vinylOriginalPosition && currentPositions[index].vinylPos) {
lpData.vinyl.position.lerpVectors(currentPositions[index].vinylPos, lpData.vinylOriginalPosition, eased);
const vinylScale = currentPositions[index].vinylScale;
lpData.vinyl.scale.setScalar(vinylScale - (vinylScale - 1) * eased);
if (lpData.vinylOriginalRotation) {
lpData.vinyl.rotation.y = currentPositions[index].vinylRot + (lpData.vinylOriginalRotation.y - currentPositions[index].vinylRot) * eased;
lpData.vinyl.rotation.x = currentPositions[index].vinylRotX + (lpData.vinylOriginalRotation.x - currentPositions[index].vinylRotX) * eased;
}
}
});
shelfObjects.forEach((shelfObj, index) => {
shelfObj.mesh.position.lerpVectors(shelfCurrentPositions[index], shelfObj.originalPosition, eased);
});
if (progress < 1) {
requestAnimationFrame(animateBack);
} else {
lpObjects.forEach(lpData => {
lpData.mesh.scale.copy(lpData.originalScale);
lpData.mesh.rotation.copy(lpData.originalRotation);
lpData.mesh.position.copy(lpData.originalPosition);
if (lpData.vinyl) {
lpData.vinyl.scale.copy(lpData.vinylOriginalScale);
lpData.vinyl.position.copy(lpData.vinylOriginalPosition);
if(lpData.vinylOriginalRotation) lpData.vinyl.rotation.copy(lpData.vinylOriginalRotation);
}
});
selectedLP = null;
isTransitioning = false;
isDetailView = false;
controls.enabled = true;
changeBackground(null);
resetPlaylistUI();
}
}

animateBack();
}

// ========== 플레이리스트 원상복구 ==========
function resetPlaylistUI() {
const playlistView = document.getElementById('playlistView');
const nowPlayingView = document.getElementById('nowPlayingView');
if (playlistView && nowPlayingView) {
playlistView.style.display = 'block';
nowPlayingView.style.display = 'none';
}
}

// ========== 배경 이미지 부드럽게 전환 ==========
function changeBackground(imageUrl) {
const mainSection = document.getElementById('main-section');
if (!mainSection) return;
let bgContainer = document.getElementById('bg-container');
if (!bgContainer) {
bgContainer = document.createElement('div');
bgContainer.id = 'bg-container';
mainSection.insertBefore(bgContainer, mainSection.firstChild);
}

const newLayer = document.createElement('div');
newLayer.classList.add('bg-layer');

if (imageUrl) {
newLayer.style.backgroundImage = `url('${imageUrl}')`;
} else {
newLayer.style.backgroundColor = 'transparent';
}

bgContainer.appendChild(newLayer);

requestAnimationFrame(() => {
newLayer.classList.add('active');
});

const oldLayers = Array.from(bgContainer.children).filter(child => child !== newLayer);
setTimeout(() => {
oldLayers.forEach(layer => layer.remove());
}, 1200);
}

// ========== 애니메이션 루프 ==========
function animate() {
requestAnimationFrame(animate);
if (controls) controls.update();

if (!selectedLP && !isTransitioning && raycaster && mouse && camera && lpObjects.length > 0) {
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(lpObjects.map(lp => lp.mesh));

lpObjects.forEach(lpData => {
const isHovered = intersects.some(intersect => intersect.object === lpData.mesh);
const targetScale = isHovered ? 1.05 : 1;
lpData.mesh.scale.x += (targetScale - lpData.mesh.scale.x) * 0.1;
lpData.mesh.scale.y += (targetScale - lpData.mesh.scale.y) * 0.1;
lpData.mesh.scale.z += (targetScale - lpData.mesh.scale.z) * 0.1;
});
}

if (renderer && scene && camera) renderer.render(scene, camera);
}

// ========== 반응형 처리 ==========
function onWindowResize() {
const container = document.getElementById('lp-drawer');
if (!container || !camera || !renderer) return;
camera.aspect = container.offsetWidth / container.offsetHeight;
camera.updateProjectionMatrix();
renderer.setSize(container.offsetWidth, container.offsetHeight);
}