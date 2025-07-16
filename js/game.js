class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 480;  // 3:4 比例，经典竖屏
        this.height = 640;
        
        // 游戏状态
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.startTime = Date.now();
        this.frameCount = 0;
        
        // 经典俄罗斯方块竖屏设置 - 适配480x640画布
        this.BLOCK_WIDTH = 4; // WIDTH = 4
        this.SCREEN_X = 120; // 经典俄罗斯方块宽度
        this.SCREEN_Y = 160; // 经典俄罗斯方块高度 (4:3 比例)
        this.SCALE = 4; // 放大4倍: 120*4=480, 160*4=640
        
        // 颜色定义
        this.colors = ['#ff004d', '#29adff', '#ffec27', '#00e436']; // RED, LIGHT_BLUE, YELLOW, GREEN
        
        // 边界设置 - 经典俄罗斯方块游戏区域 (约10宽×20高的方块网格)
        this.border_x = [20, this.SCREEN_X - 20]; // 游戏区域宽度: 80像素 -> 320像素(缩放后)
        this.border_y = [10, this.SCREEN_Y - 10]; // 游戏区域高度: 140像素 -> 560像素(缩放后)
        
        // 初始化显示系统
        this.display = new Display(this);
        
        // 初始化游戏组件
        this.currentFigure = null;
        this.nextFigure = null;
        this.gameOver = false;
        
        // 生成第一个下一个方块
        this.generateNextFigure();
        
        // 绑定事件
        this.bindEvents();
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    bindEvents() {
        this.keys = {};
        this.keysPressed = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (!this.keysPressed[e.key.toLowerCase()]) {
                this.keysPressed[e.key.toLowerCase()] = true;
            }
            
            // 防止方向键滚动页面
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    btn(key) {
        return this.keys[key] || false;
    }
    
    btnp(key) {
        if (this.keysPressed[key]) {
            this.keysPressed[key] = false;
            return true;
        }
        return false;
    }
    
    gameLoop() {
        this.frameCount++;
        
        if (this.state === 'playing') {
            this.update();
        }
        
        this.render();
        
        // 重置按键状态
        Object.keys(this.keysPressed).forEach(key => {
            if (this.keysPressed[key] === true) {
                this.keysPressed[key] = false;
            }
        });
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 按照MainGameScene的update逻辑
        if (this.btnp('escape')) {
            this.togglePause();
        }
        
        if (this.gameOver) {
            this.state = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverMenu').classList.remove('hidden');
            this.display = new Display(this);
            this.currentFigure = null;
            this.gameOver = false;
            return;
        }
        
        // 检查消除
        const sandToCllear = this.lineCheck();
        if (sandToCllear && sandToCllear.length > 0) {
            this.score += 2; // add_score
            if (this.currentFigure) {
                this.currentFigure.isMoveable = false;
            }
            // 执行消除动画
            sandToCllear.forEach(pos => {
                const sand = this.display.getPixel(pos[0], pos[1]);
                if (sand) {
                    sand.lineDestroy();
                }
            });
        } else {
            if (this.currentFigure) {
                this.currentFigure.isMoveable = true;
            }
        }
        
        // 生成新方块
        if (!this.currentFigure) {
            // 使用预设的下一个方块
            this.currentFigure = this.createFigureFromNext();
            this.currentFigure.update();
            if (this.currentFigure.isSand) {
                this.gameOver = true;
            }
            // 生成新的下一个方块
            this.generateNextFigure();
        }
        
        // 更新当前方块
        if (this.currentFigure) {
            this.currentFigure.update();
            if (this.currentFigure.isSand) {
                this.currentFigure = null;
            }
        }
        
        // 更新沙子（只有在没有消除时才更新）
        if (!sandToCllear || sandToCllear.length === 0) {
            this.display.updateSand();
        }
        
        this.updateUI();
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            // 绘制动态背景
            this.drawBackground();
            
            // 绘制边界
            this.drawBorder();
            
            // 绘制沙子
            this.display.drawSand(this.ctx);
            
            // 绘制当前方块
            if (this.currentFigure) {
                this.currentFigure.draw(this.ctx);
            }
            
            // 绘制暂停覆盖层
            if (this.state === 'paused') {
                this.drawPauseOverlay();
            }
        }
    }
    
    drawBorder() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            this.border_x[0] * this.SCALE, 
            this.border_y[0] * this.SCALE, 
            (this.border_x[1] - this.border_x[0]) * this.SCALE, 
            (this.border_y[1] - this.border_y[0]) * this.SCALE
        );
    }
    
    // 实现line_check逻辑
    lineCheck() {
        const x = this.border_x[0] + 1;
        for (let y = this.border_y[1] - 2; y > this.border_y[0]; y--) {
            const currentSand = this.display.getPixel(x, y);
            const nextSand = this.display.getPixel(x, y + 1);
            
            if (!currentSand && !nextSand) {
                return null;
            }
            
            if (!currentSand && nextSand) {
                const sand = this.waveAlgorithm(x, y + 1);
                if (sand && sand.length > 0) {
                    return sand;
                }
                return null;
            }
            
            if (currentSand && !nextSand) {
                const sand = this.waveAlgorithm(x, y);
                if (sand && sand.length > 0) {
                    return sand;
                }
                return null;
            }
            
            if (currentSand && nextSand && currentSand.color !== nextSand.color) {
                const sand = this.waveAlgorithm(x, y + 1);
                if (sand && sand.length > 0) {
                    return sand;
                }
            }
        }
        return null;
    }
    
    // 实现wave_algorithm
    waveAlgorithm(startX, startY) {
        const width = this.width;
        const height = this.height;
        const visited = Array(width).fill().map(() => Array(height).fill(false));
        const sandGroup = [];
        
        const stack = [[startX, startY]];
        visited[startX][startY] = true;
        
        let touchLeft = false;
        let touchRight = false;
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            
            if (x === this.border_x[0] + 1) {
                touchLeft = true;
            } else if (x === this.border_x[1] - 1) {
                touchRight = true;
            }
            
            sandGroup.push([x, y]);
            
            // 8方向邻居
            const neighbors = [
                [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y],
                [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (!visited[nx][ny]) {
                        const currentPixel = this.display.getPixel(x, y);
                        const neighborPixel = this.display.getPixel(nx, ny);
                        
                        if (neighborPixel && currentPixel && neighborPixel.color === currentPixel.color) {
                            stack.push([nx, ny]);
                            visited[nx][ny] = true;
                        }
                    }
                }
            }
        }
        
        if (touchLeft && touchRight) {
            return sandGroup;
        } else {
            return [];
        }
    }
    
    // 生成下一个方块的预览信息
    generateNextFigure() {
        const types = ['J', 'I', 'O', 'L', 'Z', 'T', 'S'];
        const colors = this.colors;
        
        this.nextFigure = {
            type: types[Math.floor(Math.random() * types.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
        };
        
        // 更新UI显示
        this.updateNextPreview();
    }
    
    // 从预设的下一个方块创建实际的Figure对象
    createFigureFromNext() {
        if (!this.nextFigure) {
            this.generateNextFigure();
        }
        
        const figure = new Figure(
            Math.floor(this.SCREEN_X / 2), 
            this.BLOCK_WIDTH * 4, 
            this.display,
            this.nextFigure.type,
            this.nextFigure.color
        );
        
        return figure;
    }
    
    // 更新NEXT预览显示
    updateNextPreview() {
        const nextContainer = document.querySelector('#gameInfo .info-panel:nth-child(3) div:last-child');
        if (nextContainer && this.nextFigure) {
            // 清空当前内容
            nextContainer.innerHTML = '';
            
            // 创建小型预览画布
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 40;
            previewCanvas.height = 40;
            previewCanvas.style.imageRendering = 'pixelated';
            
            const ctx = previewCanvas.getContext('2d');
            
            // 绘制预览方块
            this.drawNextFigurePreview(ctx, this.nextFigure.type, this.nextFigure.color);
            
            nextContainer.appendChild(previewCanvas);
        }
    }
    
    // 绘制下一个方块的预览
    drawNextFigurePreview(ctx, type, color) {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, 40, 40);
        
        // 方块预览的小尺寸设置
        const blockSize = 3;
        const centerX = 20;
        const centerY = 20;
        
        // 根据方块类型绘制预览
        const blocks = this.getPreviewBlocks(type, centerX, centerY, blockSize);
        
        ctx.fillStyle = color;
        blocks.forEach(block => {
            ctx.fillRect(block.x - blockSize/2, block.y - blockSize/2, blockSize, blockSize);
            
            // 添加简单的高光效果
            ctx.fillStyle = this.lightenColor(color);
            ctx.fillRect(block.x - blockSize/2, block.y - blockSize/2, blockSize-1, 1);
            ctx.fillRect(block.x - blockSize/2, block.y - blockSize/2, 1, blockSize-1);
            
            ctx.fillStyle = color;
        });
    }
    
    // 获取预览方块的位置
    getPreviewBlocks(type, centerX, centerY, blockSize) {
        const offset = blockSize + 1;
        
        switch(type) {
            case 'J':
                return [
                    {x: centerX, y: centerY},
                    {x: centerX - offset, y: centerY},
                    {x: centerX, y: centerY - offset},
                    {x: centerX, y: centerY - offset * 2}
                ];
            case 'I':
                return [
                    {x: centerX - offset * 1.5, y: centerY},
                    {x: centerX - offset * 0.5, y: centerY},
                    {x: centerX + offset * 0.5, y: centerY},
                    {x: centerX + offset * 1.5, y: centerY}
                ];
            case 'O':
                return [
                    {x: centerX - offset/2, y: centerY - offset/2},
                    {x: centerX + offset/2, y: centerY - offset/2},
                    {x: centerX - offset/2, y: centerY + offset/2},
                    {x: centerX + offset/2, y: centerY + offset/2}
                ];
            case 'L':
                return [
                    {x: centerX, y: centerY},
                    {x: centerX, y: centerY - offset},
                    {x: centerX, y: centerY - offset * 2},
                    {x: centerX + offset, y: centerY}
                ];
            case 'Z':
                return [
                    {x: centerX, y: centerY},
                    {x: centerX + offset, y: centerY},
                    {x: centerX, y: centerY - offset},
                    {x: centerX - offset, y: centerY - offset}
                ];
            case 'T':
                return [
                    {x: centerX, y: centerY},
                    {x: centerX - offset, y: centerY},
                    {x: centerX + offset, y: centerY},
                    {x: centerX, y: centerY - offset}
                ];
            case 'S':
                return [
                    {x: centerX, y: centerY},
                    {x: centerX - offset, y: centerY},
                    {x: centerX, y: centerY - offset},
                    {x: centerX + offset, y: centerY - offset}
                ];
            default:
                return [];
        }
    }
    
    // 颜色变亮函数
    lightenColor(color) {
        const colorMap = {
            '#ff004d': '#ff6b9d',
            '#29adff': '#7dc6ff', 
            '#ffec27': '#fff066',
            '#00e436': '#66f066'
        };
        return colorMap[color] || color;
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
        // 更新NEXT预览
        if (this.state === 'playing' && this.nextFigure) {
            this.updateNextPreview();
        }
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.gameOver = false;
        
        // 重置游戏组件
        this.display = new Display(this);
        this.currentFigure = null;
        this.nextFigure = null;
        
        // 生成第一个下一个方块
        this.generateNextFigure();
        
        // 隐藏菜单
        document.getElementById('mainMenu').classList.add('hidden');
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    // 绘制动态背景
    drawBackground() {
        // 绘制网格背景
        this.ctx.strokeStyle = 'rgba(41, 173, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // 绘制移动的背景线条
        this.ctx.strokeStyle = 'rgba(255, 236, 39, 0.2)';
        this.ctx.lineWidth = 2;
        
        const time = this.frameCount * 0.02;
        for (let i = 0; i < 5; i++) {
            const y = (Math.sin(time + i * 0.5) * 50) + this.height / 2 + i * 40;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    // 绘制暂停覆盖层
    drawPauseOverlay() {
        // 半透明黑色覆盖层
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制PAUSE文字
        this.ctx.fillStyle = '#ffec27';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 添加文字阴影效果
        this.ctx.shadowColor = '#ff004d';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        // 闪烁效果
        const alpha = 0.5 + 0.5 * Math.sin(this.frameCount * 0.1);
        this.ctx.globalAlpha = alpha;
        
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        
        // 重置样式
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }
}

// 全局游戏实例
let game;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});