// INFO 페이지 JavaScript

// 페이지 로드 시
window.addEventListener('load', () => {
    console.log('INFO 페이지 로드 완료');
});

// INFO 카드 호버 효과 개선
const infoCards = document.querySelectorAll('.info-card');

infoCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.boxShadow = '0 10px 30px rgba(147, 51, 234, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.boxShadow = 'none';
    });
});

// 스무스 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});