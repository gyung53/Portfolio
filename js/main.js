// ========== main.js - 3D LP Drawer 구현 (최종 수정본_v2) ==========

// 상태 관리
let scene, camera, renderer, controls;
let raycaster, mouse;
let lpObjects = [];
let shelfObjects = [];
let selectedLP = null;
let isTransitioning = false;

// 프로젝트 데이터
const projects = [
    { 
        id: 1, 
        name: 'National Museum of Korea', 
        type: 'Team Project', 
        thumbnail: '../assets/images/playlist_sum_01.png',
        bgImage: '../assets/images/lp1-bg.png'
    },
    { 
        id: 2, 
        name: 'Wellio', 
        type: 'Team Project', 
        thumbnail: '../assets/images/playlist_sum_02.png',
        bgImage: '../assets/images/lp2-bg.png'
    },
    { 
        id: 3, 
        name: 'KICO', 
        type: 'Team Project', 
        thumbnail: '../assets/images/playlist_sum_03.png',
        bgImage: '../assets/images/lp3-bg.png'
    },
    { 
        id: 4, 
        name: 'Re:bubble', 
        type: 'Team Project', 
        thumbnail: '../assets/images/playlist_sum_04.png',
        bgImage: '../assets/images/lp4-bg.png'
    },
    { 
        id: 5, 
        name: 'ER', 
        type: 'Personal Project', 
        thumbnail: '../assets/images/playlist_sum_05.png',
        bgImage: '../assets/images/lp5-bg.png'
    },
    { 
        id: 6, 
        name: 'Orion', 
        type: 'Personal Project', 
        thumbnail: '../assets/images/playlist_sum_06.png',
        bgImage: '../assets/images/lp6-bg.png'
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

    if (playlistView.style.display === 'none') {
        playlistView.style.display = 'block';
        nowPlayingView.style.display = 'none';
    } else {
        if (selectedLP) {
            playlistView.style.display = 'none';
            nowPlayingView.style.display = 'block';
        }
    }
}

// ========== 초기화 ==========
function init3DScene() {
    const container = document.getElementById('lp-drawer');
    if (!container) return;

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff); // 투명 배경

    camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    // 초기 카메라 위치 (약간 오른쪽에서 왼쪽을 바라봄)
    camera.position.set(3, 2, 5);

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

            if (child.name.includes('LP_Cover_')) {
                const idMatch = child.name.match(/\d+/);
                const id = idMatch ? parseInt(idMatch[0]) : 0;
                
                let vinyl = model.getObjectByName(`Vinyl_${id}`);
                if (!vinyl) {
                    model.traverse((obj) => {
                        const objNameLower = obj.name.toLowerCase();
                        if (objNameLower.includes('vinyl') && objNameLower.includes(id.toString())) {
                            vinyl = obj;
                        }
                    });
                }
                
                lpObjects.push({
                    mesh: child,
                    vinyl: vinyl,
                    originalPosition: child.position.clone(),
                    originalRotation: child.rotation.clone(),
                    originalScale: child.scale.clone(),
                    vinylOriginalPosition: vinyl ? vinyl.position.clone() : null,
                    vinylOriginalRotation: vinyl ? vinyl.rotation.clone() : null,
                    vinylOriginalScale: vinyl ? vinyl.scale.clone() : null,
                    id: id
                });
            }

            if (child.name === 'Cube' || child.name === 'Cylinder.001' || child.name === 'Cylinder.002' ||
                child.name === 'Cylinder001' || child.name === 'Cylinder002') {
                shelfObjects.push({ mesh: child, originalPosition: child.position.clone() });
            }
        });
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
    const intersects = raycaster.intersectObjects(lpObjects.map(lp => lp.mesh));

    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const clickedLP = lpObjects.find(lp => lp.mesh === clickedMesh);
        if (clickedLP) handleLPClick(clickedLP);
    }
}

// ========== [수정됨] LP 클릭 핸들러 (회전/위치 보정) ==========
function handleLPClick(lpData) {
    if (isTransitioning) return;

    isTransitioning = true;
    selectedLP = lpData;
    controls.enabled = false;

    const duration = 1000;
    const startTime = Date.now();

    // 1. 카메라: 화면 중앙 정렬
    const cameraStartPos = camera.position.clone();
    const cameraTargetPos = new THREE.Vector3(0, 0, 4.2); // 약간 뒤로(4.2)
    
    // 시선은 완전한 중앙(0,0,0)을 봄
    const lookAtStart = new THREE.Vector3(0, 0, 0);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    // 2. LP 커버: 화면 중앙 약간 왼쪽(-0.4)으로 이동 
    // (너무 왼쪽 -1.5로 가면 기울어져 보이므로 중앙 근처로 이동)
    const selectedCoverStartPos = lpData.mesh.position.clone();
    const selectedCoverTargetPos = new THREE.Vector3(-0.4, 0, 0);
    
    // [중요 수정] 회전: 반대 방향으로 -90도 회전 (앞면 보기 + 회전 최소화)
    const startRotationY = lpData.mesh.rotation.y;
    const targetRotationY = lpData.originalRotation.y - Math.PI / 2;

    // 3. Vinyl: 커버 오른쪽(0.9)으로 나옴
    const selectedVinylStartPos = lpData.vinyl ? lpData.vinyl.position.clone() : null;
    const selectedVinylTargetPos = lpData.vinyl ? new THREE.Vector3(0.9, 0, 0.05) : null;
    
    const vinylStartRotationY = lpData.vinyl ? lpData.vinyl.rotation.y : 0;
    const vinylTargetRotationY = (lpData.vinylOriginalRotation ? lpData.vinylOriginalRotation.y : 0) - Math.PI / 2;

    const targetScale = 1.6;

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

        // 카메라 이동
        camera.position.lerpVectors(cameraStartPos, cameraTargetPos, eased);
        const currentLookAt = new THREE.Vector3().lerpVectors(lookAtStart, lookAtTarget, eased);
        camera.lookAt(currentLookAt);

        // LP 커버 이동
        lpData.mesh.position.lerpVectors(selectedCoverStartPos, selectedCoverTargetPos, eased);
        lpData.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
        lpData.mesh.rotation.y = startRotationY + (targetRotationY - startRotationY) * eased;

        // Vinyl 이동
        if (lpData.vinyl && selectedVinylStartPos && selectedVinylTargetPos) {
            lpData.vinyl.position.lerpVectors(selectedVinylStartPos, selectedVinylTargetPos, eased);
            lpData.vinyl.scale.setScalar(1 + (targetScale - 1) * eased);
            lpData.vinyl.rotation.y = vinylStartRotationY + (vinylTargetRotationY - vinylStartRotationY) * eased;
        }

        // 주변 요소들 뒤로 밀기
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
            updatePlaylistUI(project);
        }
    }

    animateLP();
}

// ========== 플레이리스트 UI 업데이트 ==========
function updatePlaylistUI(project) {
    const playlistView = document.getElementById('playlistView');
    const nowPlayingView = document.getElementById('nowPlayingView');
    const nowPlayingCard = document.getElementById('nowPlayingCard');
    const playingNextList = document.getElementById('playingNextList');
    
    if (!nowPlayingCard || !playingNextList) return;

    changeBackground(project.bgImage);

    nowPlayingCard.innerHTML = `
        <img src="${project.thumbnail}" alt="${project.name}">
        <div class="now-playing-info">
            <div class="now-playing-name">${project.name}</div>
            <div class="now-playing-type">${project.type}</div>
        </div>
    `;

    playingNextList.innerHTML = projects
        .filter(p => p.id !== project.id)
        .map(p => `
            <div class="playing-next-item" onclick="switchToProject(${p.id})">
                <img src="${p.thumbnail}" alt="${p.name}">
                <div class="playing-next-info">
                    <div class="playing-next-name">${p.name}</div>
                    <div class="playing-next-type">${p.type}</div>
                </div>
            </div>
        `).join('');

    if (playlistView) playlistView.style.display = 'none';
    if (nowPlayingView) nowPlayingView.style.display = 'block';
}

// ========== [수정됨] 다른 프로젝트로 전환 ==========
window.switchToProject = function(projectId) {
    if (isTransitioning || !selectedLP) return;
    
    const newLP = lpObjects.find(lp => lp.id === projectId);
    const currentLP = lpObjects.find(lp => lp.id === selectedLP.id);
    if (!newLP || !currentLP) return;
    
    isTransitioning = true;
    const duration = 800;
    const startTime = Date.now();
    
    // === 현재 LP (퇴장) ===
    const currentCoverPos = currentLP.mesh.position.clone();
    const currentVinylPos = currentLP.vinyl ? currentLP.vinyl.position.clone() : null;
    const currentScale = currentLP.mesh.scale.x;
    const currentRotY = currentLP.mesh.rotation.y;
    const currentVinylRotY = currentLP.vinyl ? currentLP.vinyl.rotation.y : 0;
    
    // 퇴장 목표
    const currentTargetPos = currentLP.originalPosition.clone();
    currentTargetPos.z += 10;
    const currentTargetRotY = currentLP.originalRotation.y;
    
    // === 새 LP (입장) ===
    const newCoverStartPos = newLP.originalPosition.clone();
    newCoverStartPos.z += 10;
    const newStartRotY = newLP.originalRotation.y;
    
    // 입장 목표: 중앙 왼쪽(-0.4), 회전(-90도)
    const targetPos = new THREE.Vector3(-0.4, 0, 0);
    const targetRotY = newLP.originalRotation.y - Math.PI / 2;
    const targetScale = 1.6;

    // Vinyl 입장 목표: 중앙 오른쪽(0.9)
    const vinylTargetPos = new THREE.Vector3(0.9, 0, 0.05);
    const vinylTargetRotY = (newLP.vinylOriginalRotation ? newLP.vinylOriginalRotation.y : 0) - Math.PI / 2;

    function animateSwitch() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // 1. 현재 LP 퇴장
        currentLP.mesh.position.lerpVectors(currentCoverPos, currentTargetPos, eased);
        currentLP.mesh.scale.setScalar(currentScale - (currentScale - 1) * eased);
        currentLP.mesh.rotation.y = currentRotY + (currentTargetRotY - currentRotY) * eased;

        if (currentLP.vinyl && currentVinylPos) {
            const vinOrig = currentLP.vinylOriginalPosition.clone();
            vinOrig.z += 10;
            currentLP.vinyl.position.lerpVectors(currentVinylPos, vinOrig, eased);
            
            const vinOrigRot = currentLP.vinylOriginalRotation ? currentLP.vinylOriginalRotation.y : 0;
            currentLP.vinyl.rotation.y = currentVinylRotY + (vinOrigRot - currentVinylRotY) * eased;
            currentLP.vinyl.scale.setScalar(currentScale - (currentScale - 1) * eased);
        }
        
        // 2. 새 LP 입장
        newLP.mesh.position.lerpVectors(newCoverStartPos, targetPos, eased);
        newLP.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
        newLP.mesh.rotation.y = newStartRotY + (targetRotY - newStartRotY) * eased;
        
        if (newLP.vinyl) {
            const vinStart = newLP.vinylOriginalPosition ? newLP.vinylOriginalPosition.clone() : new THREE.Vector3();
            vinStart.z += 10;
            
            newLP.vinyl.position.lerpVectors(vinStart, vinylTargetPos, eased);
            newLP.vinyl.scale.setScalar(1 + (targetScale - 1) * eased);
            
            const vinStartRot = newLP.vinylOriginalRotation ? newLP.vinylOriginalRotation.y : 0;
            newLP.vinyl.rotation.y = vinStartRot + (vinylTargetRotY - vinStartRot) * eased;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animateSwitch);
        } else {
            isTransitioning = false;
            selectedLP = projects.find(p => p.id === projectId);
            updatePlaylistUI(selectedLP);
        }
    }
    
    animateSwitch();
}

// ========== [수정됨] LP 닫기 ==========
window.closeLPView = function() {
    if (isTransitioning || !selectedLP) return;
    
    isTransitioning = true;
    const duration = 800;
    const startTime = Date.now();
    
    // 카메라 복귀
    const cameraCurrentPos = camera.position.clone();
    const cameraOriginalPos = new THREE.Vector3(3, 2, 5);
    const lookAtStart = new THREE.Vector3(0, 0, 0); // 현재 중앙 봄
    const lookAtTarget = new THREE.Vector3(0, 0, 0); // 원래도 중앙 봄(orbit controls)

    const currentPositions = lpObjects.map(lpData => ({
        coverPos: lpData.mesh.position.clone(),
        vinylPos: lpData.vinyl ? lpData.vinyl.position.clone() : null,
        coverScale: lpData.mesh.scale.x,
        vinylScale: lpData.vinyl ? lpData.vinyl.scale.x : 1,
        coverRot: lpData.mesh.rotation.y,
        vinylRot: lpData.vinyl ? lpData.vinyl.rotation.y : 0
    }));

    const shelfCurrentPositions = shelfObjects.map(obj => obj.mesh.position.clone());

    function animateBack() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(cameraCurrentPos, cameraOriginalPos, eased);
        camera.lookAt(lookAtTarget); // LookAt은 중앙 유지

        lpObjects.forEach((lpData, index) => {
            // 위치 복구
            lpData.mesh.position.lerpVectors(currentPositions[index].coverPos, lpData.originalPosition, eased);
            // 크기 복구
            const currentScale = currentPositions[index].coverScale;
            lpData.mesh.scale.setScalar(currentScale - (currentScale - 1) * eased);
            // 회전 복구
            lpData.mesh.rotation.y = currentPositions[index].coverRot + (lpData.originalRotation.y - currentPositions[index].coverRot) * eased;

            if (lpData.vinyl && lpData.vinylOriginalPosition && currentPositions[index].vinylPos) {
                lpData.vinyl.position.lerpVectors(currentPositions[index].vinylPos, lpData.vinylOriginalPosition, eased);
                
                const vinylScale = currentPositions[index].vinylScale;
                lpData.vinyl.scale.setScalar(vinylScale - (vinylScale - 1) * eased);
                
                if (lpData.vinylOriginalRotation) {
                    lpData.vinyl.rotation.y = currentPositions[index].vinylRot + (lpData.vinylOriginalRotation.y - currentPositions[index].vinylRot) * eased;
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

// ========== 배경 이미지 부드럽게 전환하는 함수 ==========
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