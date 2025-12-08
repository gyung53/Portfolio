// INFO 페이지 JavaScript

// 페이지 로드 시
window.addEventListener('load', () => {
    console.log('INFO 페이지 로드 완료');
});

// INFO 카드 호버 효과 (CSS에서도 처리하지만 JS로 그림자 강화)
const infoCards = document.querySelectorAll('.info-card');

infoCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.boxShadow = '0 10px 30px rgba(147, 51, 234, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.boxShadow = 'none';
    });
});