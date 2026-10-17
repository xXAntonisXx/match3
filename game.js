const tg = window.Telegram.WebApp;
tg.expand();
 
const ROWS = 8;
const COLS = 8;
const TYPES = 6; 
const SPRITES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png']; 
 
let board = [];
let score = 0;
let coins = 0;
let selectedCell = null;
 
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
 
function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
 
            let type;
            do { type = Math.floor(Math.random() * TYPES); } 
            while ((c >= 2 && board[r][c-1] === type && board[r][c-2] === type) || (r >= 2 && board[r-1][c] === type && board[r-2][c] === type));
 
            board[r][c] = type;
            updateCell(cell, type);
            cell.addEventListener('click', () => handleCellClick(r, c));
            boardEl.appendChild(cell);
        }
    }
}
 
function updateCell(cell, type) {
    cell.innerHTML = `<img src="${SPRITES[type]}" alt="fruit">`;
}
 
function handleCellClick(r, c) {
    const cell = boardEl.children[r * COLS + c];
    if (!selectedCell) {
        selectedCell = { r, c, el: cell };
        cell.style.transform = 'scale(1.1)';
        cell.style.boxShadow = '0 0 15px white';
    } else {
        selectedCell.el.style.transform = 'scale(1)';
        selectedCell.el.style.boxShadow = 'none';
        const isNeighbor = Math.abs(selectedCell.r - r) + Math.abs(selectedCell.c - c) === 1;
        if (isNeighbor) swapCells(selectedCell.r, selectedCell.c, r, c);
        selectedCell = null;
    }
}
 
function swapCells(r1, c1, r2, c2) {
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
    updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
    updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
    setTimeout(() => { checkMatches(); }, 100);
}
 
function checkMatches() {
    let matched = new Set();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            if (board[r][c] !== null && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
                matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`);
            }
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
            if (board[r][c] !== null && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
                matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`);
            }
        }
    }
    if (matched.size > 0) processMatches(matched);
}
 
function processMatches(matched) {
    let points = matched.size * 10;
    score += points;
    scoreEl.innerText = score;
    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        board[r][c] = null;
        const cell = boardEl.children[r * COLS + c];
        cell.innerHTML = ''; 
    });
    setTimeout(() => { dropCells(); setTimeout(() => { checkMatches(); }, 100); }, 100);
}
 
function dropCells() {
    for (let c = 0; c < COLS; c++) {
        let emptyRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][c] !== null) {
                if (r !== emptyRow) { board[emptyRow][c] = board[r][c]; board[r][c] = null; }
                emptyRow--;
            }
        }
        for (let r = emptyRow; r >= 0; r--) {
            board[r][c] = Math.floor(Math.random() * TYPES);
        }
    }
    renderBoard();
}
 
function renderBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            updateCell(boardEl.children[r * COLS + c], board[r][c]);
        }
    }
}
 
function buyBoost() {
    if (coins >= 50) {
        coins -= 50;
        coinsEl.innerText = coins;
        createBoard();
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}
 
createBoard();