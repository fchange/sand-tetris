class Display {
    constructor(game) {
        this.game = game;
        this.display = [];

        // 初始化二维数组
        for (let i = 0; i < game.width; i++) {
            this.display.push([]);
            for (let j = 0; j < game.height; j++) {
                this.display[i].push(null);
            }
        }
    }

    checkCoords(x, y) {
        if (x <= this.game.border_x[0] || x >= this.game.border_x[1]) {
            return null;
        }
        if (y <= this.game.border_y[0] || y >= this.game.border_y[1]) {
            return null;
        }
        return true;
    }

    getPixel(x, y) {
        if (this.checkCoords(x, y) && x >= 0 && x < this.game.width && y >= 0 && y < this.game.height) {
            return this.display[x][y];
        }
        return null;
    }

    setPixel(x, y, value) {
        if (this.checkCoords(x, y) && x >= 0 && x < this.game.width && y >= 0 && y < this.game.height) {
            this.display[x][y] = value;
        }
    }

    drawSand(ctx) {
        for (let row of this.display) {
            for (let sand of row) {
                if (sand) {
                    sand.draw(ctx);
                }
            }
        }
    }

    updateSand() {
        // 从下往上更新，避免重复更新
        for (let j = this.game.height - 1; j >= 0; j--) {
            for (let i = 0; i < this.game.width; i++) {
                const sand = this.display[i][j];
                if (sand) {
                    sand.update();
                }
            }
        }
    }
}

class Particle {
    constructor(x, y, color, mutableColor, display) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.mutableColor = mutableColor;
        this.display = display;
        this.delay = 30;

        this.display.setPixel(x, y, this);
    }

    draw(ctx) {
        const scale = this.display.game.SCALE;
        const pixelX = this.x * scale;
        const pixelY = this.y * scale;
        
        // 绘制主要沙粒
        ctx.fillStyle = this.mutableColor;
        ctx.fillRect(pixelX, pixelY, scale, scale);
        
        // 添加高光效果（像素风格）
        if (this.delay === 30) { // 正常状态下添加高光
            ctx.fillStyle = this.lightenColor(this.mutableColor, 0.3);
            ctx.fillRect(pixelX, pixelY, Math.max(1, scale/2), Math.max(1, scale/2));
        }
    }
    
    // 颜色变亮函数
    lightenColor(color, amount) {
        const colorMap = {
            '#ff004d': '#ff6b9d',
            '#29adff': '#7dc6ff', 
            '#ffec27': '#fff066',
            '#00e436': '#66f066'
        };
        return colorMap[color] || color;
    }

    moveTo(x, y) {
        this.display.setPixel(this.x, this.y, null);
        this.x = x;
        this.y = y;
        this.display.setPixel(this.x, this.y, this);
    }

    lineDestroy() {
        if (this.delay > 0) {
            this.delay--;
            const colors = ['#ff004d', '#29adff', '#ffec27', '#00e436', '#ffffff', '#000000'];
            this.mutableColor = colors[this.display.game.frameCount % colors.length];
            return;
        }
        this.display.setPixel(this.x, this.y, null);
    }
}

class Sand extends Particle {
    constructor(x, y, color, mutableColor, display) {
        super(x, y, color, mutableColor, display);
    }

    update() {
        const bottomPixel = this.display.getPixel(this.x, this.y + 1);
        const leftBottomPixel = this.display.getPixel(this.x - 1, this.y + 1);
        const rightBottomPixel = this.display.getPixel(this.x + 1, this.y + 1);

        // 如果三个方向都被占用，停止移动
        if (bottomPixel && leftBottomPixel && rightBottomPixel) {
            return;
        }

        // 如果到达底部边界，停止移动
        if (this.y === this.display.game.border_y[1] - 1) {
            return;
        }

        // 左边界处理
        if (this.x <= this.display.game.border_x[0] + 1) {
            if (bottomPixel && !rightBottomPixel) {
                this.moveTo(this.x + 1, this.y + 1);
                return;
            }
        }

        // 右边界处理
        if (this.x >= this.display.game.border_x[1] - 1) {
            if (bottomPixel && !leftBottomPixel) {
                this.moveTo(this.x - 1, this.y + 1);
                return;
            }
        }

        // 在边界上且下方被占用时停止
        if (this.x <= this.display.game.border_x[0] + 1 || this.x >= this.display.game.border_x[1] - 1) {
            if (bottomPixel) {
                return;
            }
        }

        // 优先直接下落
        if (bottomPixel === null) {
            this.moveTo(this.x, this.y + 1);
            return;
        }

        // 如果下方被占用，尝试侧向流动
        if (bottomPixel instanceof Particle) {
            if (leftBottomPixel instanceof Particle && rightBottomPixel instanceof Particle) {
                return;
            } else if (leftBottomPixel === null) {
                this.moveTo(this.x - 1, this.y + 1);
                return;
            } else if (rightBottomPixel === null) {
                this.moveTo(this.x + 1, this.y + 1);
                return;
            }
        }
    }
}