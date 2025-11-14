// 메인 섹션 (WORK 페이지) JavaScript

// 페이지 로드 시 애니메이션 실행
window.addEventListener('load', () => {
    document.body.style.overflow = 'auto';
});

// 플레이리스트 아이템 클릭 이벤트
const playlistItems = document.querySelectorAll('.playlist-items li');

playlistItems.forEach(item => {
    item.addEventListener('click', () => {
        const projectId = item.getAttribute('data-project');
        console.log('선택한 프로젝트:', projectId);
        
        // 여기에 프로젝트 상세 페이지로 이동하는 로직 추가
        // 예: window.location.href = `project.html?id=${projectId}`;
    });
    
    // 호버 효과
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateX(5px)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateX(0)';
    });
});

// LP 서랍장 클릭 이벤트
const lpDrawer = document.getElementById('lpDrawer');

if (lpDrawer) {
    lpDrawer.addEventListener('click', () => {
        console.log('LP 서랍장 클릭');
        // 서랍 인터랙션 추가 가능
    });
    
    // 호버 효과
    lpDrawer.style.cursor = 'pointer';
    lpDrawer.addEventListener('mouseenter', () => {
        lpDrawer.style.transform = 'translateY(-50%) scale(1.02)';
    });
    
    lpDrawer.addEventListener('mouseleave', () => {
        lpDrawer.style.transform = 'translateY(-50%) scale(1)';
    });
}