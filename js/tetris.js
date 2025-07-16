class Block {
    constructor(x, y, color, display) {
        this.x = x;
        this.y = y;
        this.skin = 0;
        this.width = display.game.BLOCK_WIDTH;
        this.color = color;
        this.display = display;
    }

    toSand() {
        // 将4x4的方块转换为沙子
        for (let y = this.y; y < this.y + this.width; y++) {
            for (let x = this.x; x < this.x + this.width; x++) {
                new Sand(x, y, this.color, this.color, this.display);
            }
        }
    }

    draw(ctx) {
        // 绘制4x4的方块，应用缩放
        const scale = this.display.game.SCALE;
        const pixelX = this.x * scale;
        const pixelY = this.y * scale;
        const pixelSize = this.width * scale;

        // 绘制主体
        ctx.fillStyle = this.color;
        ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);

        // 绘制高光（左上角）
        ctx.fillStyle = this.lightenColor(this.color);
        ctx.fillRect(pixelX, pixelY, pixelSize - 2, 2);
        ctx.fillRect(pixelX, pixelY, 2, pixelSize - 2);

        // 绘制阴影（右下角）
        ctx.fillStyle = this.darkenColor(this.color);
        ctx.fillRect(pixelX + pixelSize - 2, pixelY + 2, 2, pixelSize - 2);
        ctx.fillRect(pixelX + 2, pixelY + pixelSize - 2, pixelSize - 2, 2);

        // 绘制边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, pixelSize, pixelSize);
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

    // 颜色变暗函数
    darkenColor(color) {
        const colorMap = {
            '#ff004d': '#cc0033',
            '#29adff': '#1a7acc',
            '#ffec27': '#ccbb00',
            '#00e436': '#00aa22'
        };
        return colorMap[color] || color;
    }

    update() {
        const y = this.y + this.width;

        // 检查是否到达底部边界
        if (y >= this.display.game.border_y[1]) {
            return true;
        }

        // 检查是否与沙子碰撞
        for (let x = this.x; x < this.x + this.width; x++) {
            if (this.display.getPixel(x, y)) {
                return true;
            }
        }

        return false;
    }
}

class Figure {
    constructor(x, y, display, presetType = null, presetColor = null) {
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.display = display;
        this.isSand = false;
        this.isMoveable = true;

        // 方块类型定义
        this.types = ['J', 'I', 'O', 'L', 'Z', 'T', 'S'];

        // 使用预设类型和颜色，或随机生成
        this.randomTypes = presetType || this.types[Math.floor(Math.random() * this.types.length)];
        this.randomColor = presetColor || display.game.colors[Math.floor(Math.random() * display.game.colors.length)];

        // 生成方块
        this.blocks = this.getFigure(x, y, this.randomColor, display, this.randomTypes);

        // 只有在没有预设类型时才随机旋转（保持NEXT预览的一致性）
        if (!presetType) {
            // 随机旋转1-4次
            for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
                this.rotate(Math.floor(Math.random() * 2));
            }
        }
    }

    getFigure(x, y, color, display, fType) {
        const width = display.game.BLOCK_WIDTH;

        switch (fType) {
            case 'J':
                return [
                    new Block(x, y, color, display),
                    new Block(x - width, y, color, display),
                    new Block(x, y - width, color, display),
                    new Block(x, y - width * 2, color, display)
                ];
            case 'I':
                return [
                    new Block(x - width * 0 - width / 2, y, color, display),
                    new Block(x - width * 1 - width / 2, y, color, display),
                    new Block(x - width * 2 - width / 2, y, color, display),
                    new Block(x - width * 3 - width / 2, y, color, display)
                ];
            case 'O':
                return [
                    new Block(x, y, color, display),
                    new Block(x - width, y, color, display),
                    new Block(x - width, y - width, color, display),
                    new Block(x, y - width, color, display)
                ];
            case 'L':
                return [
                    new Block(x, y, color, display),
                    new Block(x, y - width, color, display),
                    new Block(x, y - width * 2, color, display),
                    new Block(x + width, y, color, display)
                ];
            case 'Z':
                return [
                    new Block(x, y, color, display),
                    new Block(x + width, y, color, display),
                    new Block(x, y - width, color, display),
                    new Block(x - width, y - width, color, display)
                ];
            case 'T':
                return [
                    new Block(x, y, color, display),
                    new Block(x - width, y, color, display),
                    new Block(x + width, y, color, display),
                    new Block(x, y - width, color, display)
                ];
            case 'S':
                return [
                    new Block(x, y, color, display),
                    new Block(x - width, y, color, display),
                    new Block(x, y - width, color, display),
                    new Block(x + width, y - width, color, display)
                ];
            default:
                return [];
        }
    }

    checkBlocksBorder() {
        const allLeftX = [];
        const allRightX = [];

        for (const block of this.blocks) {
            const leftX = block.x;
            const rightX = block.x + this.display.game.BLOCK_WIDTH;

            if (leftX < this.display.game.border_x[0] + 2) {
                allLeftX.push(leftX);
            }
            if (rightX > this.display.game.border_x[1] - 1) {
                allRightX.push(rightX);
            }
        }

        if (allLeftX.length > 0) {
            const maxLeftX = Math.min(...allLeftX);
            const offset = Math.abs(this.display.game.border_x[0] + 1 - maxLeftX);
            this.updatePos(offset, 0);
            return false;
        }

        if (allRightX.length > 0) {
            const maxRightX = Math.max(...allRightX);
            const offset = Math.abs(maxRightX - this.display.game.border_x[1]);
            this.updatePos(-offset, 0);
            return true;
        }

        return null;
    }

    rotate(direction) {
        if (this.randomTypes === 'O') {
            return;
        }

        for (const block of this.blocks) {
            let nx, ny;
            if (direction) {
                // 顺时针旋转
                nx = block.y - this.y + this.x;
                ny = -block.x + this.x + this.y;
            } else {
                // 逆时针旋转
                nx = -block.y + this.y + this.x;
                ny = block.x - this.x + this.y;
            }
            block.x = nx;
            block.y = ny;
        }

        this.checkBlocksBorder();
    }

    updatePos(x, y) {
        this.x += x;
        this.y += y;
        for (const block of this.blocks) {
            block.x += x;
            block.y += y;
        }
    }

    update() {
        if (this.isMoveable) {
            this.updatePos(0, this.speed);
            this.checkBlocksBorder();

            // 处理输入
            if (this.display.game.btn('arrowleft')) {
                if (this.checkBlocksBorder() !== false) {
                    this.updatePos(-2, 0);
                }
            }
            if (this.display.game.btn('arrowright')) {
                if (this.checkBlocksBorder() !== true) {
                    this.updatePos(2, 0);
                }
            }

            if (this.display.game.btnp('x') || this.display.game.btnp('arrowup')) {
                this.rotate(true);
            }

            if (this.display.game.btnp('c')) {
                this.rotate(false);
            }

            if (this.display.game.btnp('arrowdown')) {
                // 硬降落
                const minX = Math.min(...this.blocks.map(block => block.x));
                const maxX = Math.max(...this.blocks.map(block => block.x + this.display.game.BLOCK_WIDTH));
                const maxY = Math.max(...this.blocks.map(block => block.y + this.display.game.BLOCK_WIDTH));

                for (let y = maxY; y < this.display.game.border_y[1]; y++) {
                    for (let x = minX; x < maxX; x++) {
                        if (this.display.getPixel(x, y) || y === this.display.game.border_y[1] - 1) {
                            this.updatePos(0, y - maxY - 1);
                            return;
                        }
                    }
                }
            }
        }

        // 检查碰撞
        for (const block of this.blocks) {
            if (block.update()) {
                this.isSand = true;
                // 转换为沙子
                for (const b of this.blocks) {
                    b.toSand();
                }
                this.blocks = [];
                return;
            }
        }
    }

    draw(ctx) {
        for (const block of this.blocks) {
            block.draw(ctx);
        }
    }
}