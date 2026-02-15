document.addEventListener('DOMContentLoaded', () => {
    initFanDisplay();
    setupModal();
    setupRevealUI();
    setupMenu();
});

let fanImages = [];
const frontImages = [
    'style/img/front_1.jpg',
    'style/img/front_2.jpg',
    'style/img/front_3.jpg',
    'style/img/front_4.jpg',
    'style/img/front_5.jpg'
];

const backImages = [
    'style/img/back_1.jpg',
    'style/img/back_2.jpg',
    'style/img/back_3.jpg',
    'style/img/back_4.jpg',
    'style/img/back_5.jpg'
];

const moneyImages = [
    'style/img/money/5k.jpg',
    'style/img/money/10k.jpg',
    'style/img/money/20k.jpg',
    'style/img/money/50k.jpg',
    'style/img/money/100k.jpg'
];

// Default Probabilities (20% each)
let probabilities = [10, 10, 30, 30, 20];

let peekTimer = null;
let currentMoneyIdx = 0;
let fireworksInterval = null;

function initFanDisplay() {
    const container = document.createElement('div');
    container.className = 'fan-container';
    document.body.appendChild(container);

    const count = 10;
    createCards(container, count, 100);
}

function getWeightedRandomMoneyIdx() {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] <= 0) continue; // Skip 0% items
        cumulative += probabilities[i];
        if (random < cumulative) {
            return i;
        }
    }
    // Fallback: find the last item with > 0% probability
    for (let i = probabilities.length - 1; i >= 0; i--) {
        if (probabilities[i] > 0) return i;
    }
    return 0;
}

function createCards(container, count, spreadAngle) {
    container.innerHTML = '';
    fanImages = [];

    const step = count > 1 ? spreadAngle / (count - 1) : 0;
    const startAngle = -(spreadAngle / 2);

    for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        const imgIdx = Math.floor(Math.random() * frontImages.length);
        const moneyIdx = getWeightedRandomMoneyIdx();

        img.src = frontImages[imgIdx];
        img.dataset.imgIdx = imgIdx;
        img.dataset.moneyIdx = moneyIdx;
        img.className = 'fan-image';

        const angle = startAngle + (i * step);
        img.style.transform = `rotate(0deg) translateY(20px)`;
        img.style.opacity = '0';

        container.appendChild(img);
        fanImages.push({ element: img, currentZ: i });

        img.addEventListener('click', () => {
            img.classList.add('selected');
            setTimeout(() => {
                openCardModal(img.src, img.dataset.imgIdx, img.dataset.moneyIdx, img);
            }, 400);
        });

        setTimeout(() => {
            img.style.transform = `rotate(${angle}deg) translateY(0px)`;
            img.style.opacity = '1';
            img.style.zIndex = i;
        }, 50 * i);
    }
}



function setupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'card-modal';

    modal.innerHTML = `
        <div class="flip-card" id="modal-flip-card">
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <img id="modal-front-img" src="" alt="Front">
                </div>
                <!-- Money is a sibling to the envelope, fixed in the background -->
                <img id="modal-money-img" class="money-img" src="" alt="Money">
                <div class="flip-card-back">
                    <img id="modal-back-img" src="" alt="Back">
                </div>
            </div>
        </div>
        <div class="close-hint">Nhấn giữ Lì Xì để xem mệnh giá</div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.className === 'close-hint') {
            closeCardModal();
        }
    });

    const flipCard = modal.querySelector('.flip-card');

    const startPeek = () => {
        if (flipCard.classList.contains('flipped')) {
            flipCard.classList.add('peeking');
        }
    };

    const endPeek = () => {
        flipCard.classList.remove('peeking');
    };

    flipCard.addEventListener('mousedown', startPeek);
    flipCard.addEventListener('mouseup', endPeek);
    flipCard.addEventListener('mouseleave', endPeek);
    flipCard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startPeek();
    });
    flipCard.addEventListener('touchend', endPeek);
}

function setupRevealUI() {
    const revealContainer = document.createElement('div');
    revealContainer.className = 'reveal-container';
    revealContainer.id = 'reveal-container';

    revealContainer.innerHTML = `
        <div class="close-reveal-btn">&times;</div>
        <img class="revealed-money" id="final-money-img" src="" alt="Final Money">
    `;

    document.body.appendChild(revealContainer);

    revealContainer.querySelector('.close-reveal-btn').addEventListener('click', () => {
        revealContainer.classList.remove('active');
        if (fireworksInterval) {
            clearInterval(fireworksInterval);
            fireworksInterval = null;
        }
        closeCardModal();
    });
}

function triggerFinalReveal() {
    const revealContainer = document.getElementById('reveal-container');
    const finalImg = document.getElementById('final-money-img');

    finalImg.src = moneyImages[currentMoneyIdx];
    revealContainer.classList.add('active');

    // Continuous Colorful Fireworks Effect
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Clear any existing one just in case
    if (fireworksInterval) clearInterval(fireworksInterval);

    fireworksInterval = setInterval(function () {
        const particleCount = 25; // Smaller chunks for continuous effect

        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);

    // Initial big burst
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 3000
    });

    if (currentSelectedCard) {
        currentSelectedCard.dataset.moneyIdx = getWeightedRandomMoneyIdx();
    }
}

function setupMenu() {
    const menuContainer = document.getElementById('menu-container');
    const menuTrigger = document.getElementById('menu-trigger');
    const musicToggle = document.getElementById('music-toggle');
    const bgMusic = document.getElementById('bg-music');

    // Menu Toggle
    menuTrigger.addEventListener('click', () => {
        menuContainer.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuContainer.contains(e.target)) {
            menuContainer.classList.remove('active');
        }
    });

    // Music Toggle
    let isPlaying = false;
    bgMusic.currentTime = 15;
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering any other click listeners
        const icon = musicToggle.querySelector('i');

        if (isPlaying) {
            bgMusic.pause();
            icon.className = 'fa-solid fa-volume-xmark';
            isPlaying = false;
        } else {
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    icon.className = 'fa-solid fa-volume-high';
                    isPlaying = true;
                }).catch(error => {
                    console.error("Phát nhạc bị chặn bởi trình duyệt. Hãy tương tác với trang trước.", error);
                    icon.className = 'fa-solid fa-volume-xmark';
                    isPlaying = false;
                });
            }
        }
    });
}

let currentSelectedCard = null;

function openCardModal(frontSrc, imgIdx, moneyIdx, cardElement) {
    const modal = document.getElementById('card-modal');
    const frontImg = document.getElementById('modal-front-img');
    const backImg = document.getElementById('modal-back-img');
    const moneyImg = document.getElementById('modal-money-img');
    const flipCard = document.getElementById('modal-flip-card');

    currentSelectedCard = cardElement;
    currentMoneyIdx = parseInt(moneyIdx);

    frontImg.src = frontSrc;
    backImg.src = backImages[imgIdx];
    moneyImg.src = moneyImages[currentMoneyIdx];

    flipCard.classList.remove('flipped');
    flipCard.classList.remove('peeking');
    modal.classList.add('active');

    setTimeout(() => {
        if (modal.classList.contains('active')) {
            flipCard.classList.add('flipped');
        }
    }, 1800);
}

function closeCardModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('active');

    if (currentSelectedCard) {
        setTimeout(() => {
            currentSelectedCard.classList.remove('selected');
            currentSelectedCard = null;
        }, 500);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

