// 로딩 섹션 관련 JavaScript

// 요소 선택
const loadingSection = document.getElementById('loading-section');
const lpCircle = document.getElementById('lpCircle');
const gaugeRing = document.getElementById('gaugeRing');
const gaugeProgress = document.getElementById('gaugeProgress');
const centerCircle = document.getElementById('centerCircle');
const blurBackground = document.querySelector('.blur-background .bg_img');
const welcomeText = document.querySelector('.welcome-text');

// 상태 관리
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let currentX = mouseX;
let currentY = mouseY;
let isMouseMoved = false;
let loadingComplete = false;
let mainTransitionComplete = false;

// 가상 스크롤 값
let virtualScrollY = 0;
const scrollSpeed = 1.5; // 스크롤 민감도 조절 (값이 클수록 빠름)

// SVG circle 둘레 계산 (2πr)
const radius = 45;
const circumference = 2 * Math.PI * radius;
gaugeProgress.style.strokeDasharray = circumference;
gaugeProgress.style.strokeDashoffset = circumference;

// 마우스 이동 감지
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!isMouseMoved) {
        isMouseMoved = true;
        lpCircle.classList.add('visible');
    }
});

// LP 원을 부드럽게 마우스 위치로 이동
function updateLpCirclePosition() {
    if (!loadingComplete && !mainTransitionComplete) {
        // 부드러운 따라가기 효과 (lerp)
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        lpCircle.style.left = `${currentX}px`;
        lpCircle.style.top = `${currentY}px`;
    }
    
    requestAnimationFrame(updateLpCirclePosition);
}
updateLpCirclePosition();

// 마우스 휠 이벤트 처리
let scrollProgress = 0;
const loadingScrollHeight = window.innerHeight * 1.5;
const mainScrollHeight = window.innerHeight * 0.5;

window.addEventListener('wheel', (e) => {
    // 기본 스크롤 동작 방지
    e.preventDefault();
    
    // 가상 스크롤 값 업데이트 (아래로만 스크롤 가능)
    virtualScrollY += e.deltaY * scrollSpeed;
    virtualScrollY = Math.max(0, virtualScrollY); // 음수 방지
    
    // Phase 1 & 2: 로딩 진행 (블러 제거 + 게이지 채우기)
    if (!loadingComplete) {
        scrollProgress = Math.min(virtualScrollY / loadingScrollHeight, 1);
        
        // 게이지 업데이트
        const offset = circumference - (scrollProgress * circumference);
        gaugeProgress.style.strokeDashoffset = offset;
        
        // 블러 감소
        const blurAmount = (1 - scrollProgress) * 20;
        blurBackground.style.filter = `blur(${blurAmount}px)`;
        
        // 안내 문구 페이드아웃
        welcomeText.style.opacity = 1 - scrollProgress;
        
        // 로딩 완료 체크
        if (scrollProgress >= 1 && !loadingComplete) {
            loadingComplete = true;
            completeLoading();
        }
    }
    
    // Phase 3: 로딩 완료 후 메인 진입
    else if (!mainTransitionComplete) {
        const additionalScroll = virtualScrollY - loadingScrollHeight;
        const mainProgress = Math.min(additionalScroll / mainScrollHeight, 1);
        
        if (mainProgress >= 1) {
            mainTransitionComplete = true;
            enterMainSection();
        }
    }
}, { passive: false }); // passive: false로 설정해야 preventDefault()가 작동

// Phase 3: 로딩 완료 (흰 원 확대 + 타이포 크기 증가 + 게이지 페이드아웃)
function completeLoading() {
/*     // LP 원을 화면 중앙으로 이동
    lpCircle.style.left = '50%';
    lpCircle.style.top = '50%';
    lpCircle.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'; */
    
    // 게이지 페이드아웃
    gaugeRing.classList.add('fade-out');
    
    // 확대 효과
    setTimeout(() => {
        lpCircle.classList.add('expanding');
    }, 100);
    
    // 안내 문구 완전히 숨기기
    welcomeText.style.display = 'none';
}

// Phase 4: 메인 섹션 진입
function enterMainSection() {
    // LP 원을 전체 화면으로 확대
    lpCircle.classList.add('full-screen');
    
    setTimeout(() => {
        // main.html로 페이지 이동
        window.location.href = 'main.html';
    }, 1200);
}

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    // body의 minHeight 설정 제거 (더 이상 필요 없음)
});