// UI控制函数
function startGame() {
    if (game) {
        game.startGame();
    }
}

function showInstructions() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('instructionsMenu').classList.remove('hidden');
}

function resumeGame() {
    if (game) {
        game.togglePause();
    }
}

function restartGame() {
    document.getElementById('gameOverMenu').classList.add('hidden');
    if (game) {
        game.startGame();
    }
}

function backToMenu() {
    // 隐藏所有菜单
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('instructionsMenu').classList.add('hidden');
    
    // 显示主菜单
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // 重置游戏状态
    if (game) {
        game.state = 'menu';
    }
}

// 键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // ESC键返回主菜单
    if (e.key === 'Escape') {
        if (game && game.state !== 'menu') {
            backToMenu();
        }
    }
    
    // 空格键暂停/继续
    if (e.key === ' ') {
        e.preventDefault();
        if (game && (game.state === 'playing' || game.state === 'paused')) {
            game.togglePause();
        }
    }
});

// 添加触摸控制支持（移动设备）
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!game || game.state !== 'playing') return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                game.tetris.moveRight();
            } else {
                game.tetris.moveLeft();
            }
        }
    } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                game.tetris.hardDrop();
            }
        }
    }
});

// 双击旋转
let lastTouchTime = 0;
document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTouchTime;
    
    if (tapLength < 500 && tapLength > 0) {
        // 双击检测
        if (game && game.state === 'playing') {
            game.tetris.rotateClockwise();
        }
    }
    
    lastTouchTime = currentTime;
});

// 防止页面滚动
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// 窗口大小调整
window.addEventListener('resize', () => {
    // 这里可以添加响应式布局逻辑
    // 目前保持固定大小
});

// 添加音效支持（可选）
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }
    
    loadSound(name, url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds[name] = audio;
    }
    
    play(name, volume = 1.0) {
        if (!this.enabled || !this.sounds[name]) return;
        
        const sound = this.sounds[name].cloneNode();
        sound.volume = volume;
        sound.play().catch(e => {
            // 忽略播放错误（通常是用户交互限制）
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 全局音效管理器
const soundManager = new SoundManager();

// 可以在这里加载音效文件
// soundManager.loadSound('drop', 'sounds/drop.wav');
// soundManager.loadSound('eliminate', 'sounds/eliminate.wav');
// soundManager.loadSound('rotate', 'sounds/rotate.wav');