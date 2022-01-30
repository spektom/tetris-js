const BOARD_ROWS = 20;
const BOARD_COLS = 10;
const COLORS = ['#5F2674', '#D4076F', '#8AE300', '#FFF100', '#2A4EE1', '#FA6000'];
const SHAPES = [
    [[1, 2], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[0, 2], [1, 2], [2, 1], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 1], [2, 2]]
];

function randomInt(to) {
    return Math.floor(Math.random() * to);
}

class UI {
    constructor() {
        this.board = document.getElementById("board");
        this.score = document.getElementById("score");
        this.preview = document.getElementById("preview");
        this.boardCellSize = this.board.clientWidth / BOARD_COLS;
        this.previewCellSize = this.preview.clientWidth / SHAPES[0].length;
    }

    drawCell(parent, row, col, size, color, idPrefix) {
        let cell = document.createElement("span");
        cell.setAttribute("id", `${idPrefix}-${row}-${col}`);
        cell.className = "cell";
        cell.style.top = `${size * row}px`;
        cell.style.left = `${size * col}px`;
        cell.style.width = `${size}px`;
        cell.style.height = `${size}px`;
        cell.style.backgroundColor = color;
        parent.appendChild(cell);
    }

    drawBoardCell(row, col, color) {
        this.drawCell(this.board, row, col, this.boardCellSize, color, 'c');
    }

    drawPreviewCell(row, col, color) {
        this.drawCell(this.preview, row, col, this.previewCellSize, color, 'p');
    }

    moveBoardCellDown(row, col, count) {
        let cell = document.getElementById(`c-${row}-${col}`);
        cell.setAttribute("id", `c-${row + count}-${col}`);
        cell.style.top = `${cell.offsetTop + this.boardCellSize * count}px`;
    }

    removeBoardCell(row, col) {
        let cell = document.getElementById(`c-${row}-${col}`);
        if (cell) {
            this.board.removeChild(cell);
        }
    }

    clearCells(parent) {
        while (parent.lastElementChild) {
            parent.removeChild(parent.lastElementChild);
        }
    }

    clearBoard() {
        this.clearCells(this.board);
    }

    clearPreview() {
        this.clearCells(this.preview);
    }

    drawScore(score) {
        this.score.innerText = score;
    }

    showAlert(text) {
        let alert = document.createElement("div");
        alert.className = "alert";
        alert.innerText = text;
        this.board.appendChild(alert);
    }
}

class Board {
    constructor(ui) {
        this.ui = ui;
        this.initBoard();
    }

    initBoard() {
        this.inner = Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }, () => 0));
    }

    clear() {
        this.ui.clearBoard();
        this.initBoard();
    }

    canPlaceCell(row, col) {
        return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS && this.inner[row][col] == 0;
    }

    canPlaceCells(cells) {
        return cells.every(([row, col]) => this.canPlaceCell(row, col));
    }

    placeCell(row, col, color) {
        this.ui.drawBoardCell(row, col, color);
        this.inner[row][col] = 1;
    }

    moveDownCell(row, col, count) {
        this.ui.moveBoardCellDown(row, col, count);
        this.inner[row][col] = 0;
        this.inner[row + count][col] = 1;
    }

    removeCell(row, col) {
        this.ui.removeBoardCell(row, col);
        this.inner[row][col] = 0;
    }

    updateShape(oldShape, newShape) {
        let oldCells = oldShape.toCells();
        let newCells = newShape.toCells();
        let removeCells = oldCells.filter(c1 =>
            newCells.find(c2 => c1[0] == c2[0] && c1[1] == c2[1]) == undefined);
        let addCells = newCells.filter(c1 =>
            oldCells.find(c2 => c1[0] == c2[0] && c1[1] == c2[1]) == undefined);
        if (!this.canPlaceCells(addCells)) {
            return false;
        }
        removeCells.forEach(([row, col]) => this.removeCell(row, col));
        addCells.forEach(([row, col]) => this.placeCell(row, col, newShape.color));
        return true;
    }

    addNewShape(newShape) {
        let cells = newShape.toCells();
        if (!this.canPlaceCells(cells)) {
            return false;
        }
        cells.forEach(([row, col]) => this.placeCell(row, col, newShape.color));
        return true;
    }

    moveDownRows(startRow, endRow, count) {
        for (let row = endRow - 1; row >= startRow; --row) {
            this.inner[row].forEach((value, col) => {
                if (value == 1) {
                    this.moveDownCell(row, col, count);
                }
            });
        }
    }

    clearCompletedLines() {
        let deletedRows = [];
        this.inner.forEach((row, rowIdx) => {
            if (row.every(v => v == 1)) {
                row.forEach((_, colIdx) => this.removeCell(rowIdx, colIdx));
                deletedRows.push(rowIdx);
            }
        });

        let count = 1;
        for (let i = deletedRows.length - 1; i >= 0; --i) {
            if (i > 0 && deletedRows[i] == deletedRows[i - 1] + 1) {
                ++count;
            } else {
                let startRow = i > 0 ? deletedRows[i - 1] + 1 : 0;
                this.moveDownRows(startRow, deletedRows[i], count);
                count = 1;
            }
        }
        return deletedRows.length;
    }
}

class Shape {
    constructor(cells, color, row, col) {
        this.cells = cells;
        this.color = color;
        this.row = row;
        this.col = col;
    }

    static makeRandom(row, col) {
        let color = COLORS[randomInt(COLORS.length)];
        let randomShape = SHAPES[randomInt(SHAPES.length)];
        return new Shape(randomShape, color, row, col);
    }

    toCells() {
        return this.cells.map(([row, col]) => [this.row + row, this.col + col]);
    }

    withOffset(rowOffset, colOffset) {
        return new Shape(this.cells, this.color, this.row + rowOffset, this.col + colOffset);
    }

    rotated() {
        let rotatedCells = this.cells.map(([row, col]) => [col, 3 - row]);
        return new Shape(rotatedCells, this.color, this.row, this.col);
    }
}

class Game {
    constructor() {
        this.ui = new UI();
        this.board = new Board(this.ui);
    }

    start() {
        let self = this;
        this.timer = setInterval(() => { self.update() }, this.interval * 1000);
        this.keyListener = (event) => {
            if (self.shape != null) {
                switch (event.key) {
                    case 'ArrowLeft':
                        self.moveShape(0, -1);
                        break;
                    case 'ArrowUp':
                        self.rotateShape();
                        break;
                    case 'ArrowRight':
                        self.moveShape(0, 1);
                        break;
                    case 'ArrowDown':
                        self.moveShape(1, 0);
                        break;
                }
            }
        };
        document.addEventListener('keydown', this.keyListener);
    }

    pause() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.keyListener) {
            document.removeEventListener('keydown', this.keyListener);
            this.keyListener = null;
        }
    }

    startNewGame() {
        this.pause();
        this.board.clear();
        this.shape = null;
        this.nextShape = null;
        this.score = 0;
        this.interval = 1;
        this.ui.drawScore(this.score);
        this.start();
    }

    drawNextShapePreview() {
        this.ui.clearPreview();
        this.nextShape.toCells().forEach(([row, col]) => {
            this.ui.drawPreviewCell(row, col, this.nextShape.color);
        });
    }

    addNewShape() {
        let initCol = BOARD_COLS / 2 - 2;
        let shape = this.nextShape ? this.nextShape.withOffset(0, initCol) : Shape.makeRandom(0, initCol);
        if (this.board.addNewShape(shape)) {
            this.shape = shape;
            this.nextShape = Shape.makeRandom(0, 0);
            this.drawNextShapePreview();
            return true;
        }
        return false;
    }

    transformShape(transform) {
        let newShape = transform(this.shape);
        if (this.board.updateShape(this.shape, newShape)) {
            this.shape = newShape;
            return true;
        }
        return false;
    }

    moveShape(rowOffset, colOffset) {
        return this.transformShape(shape => shape.withOffset(rowOffset, colOffset));
    }

    rotateShape() {
        return this.transformShape(shape => shape.rotated());
    }

    updateScore() {
        this.ui.drawScore(this.score);
        if (this.score % 5 == 0) {
            this.pause();
            this.interval *= 0.98;
            this.start();
        }
    }

    update() {
        if (this.shape != null) {
            if (this.moveShape(1, 0)) {
                return;
            }
            this.shape = null;
            this.score += this.board.clearCompletedLines();
            this.updateScore();
        }
        if (!this.addNewShape()) {
            this.ui.showAlert("Game over!");
            this.pause();
        }
    }
}

var game = new Game();
game.startNewGame();