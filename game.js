const tg = window.Telegram.WebApp;
tg.expand();
 
const ROWS = 8;
const COLS = 8;
const TYPES = 6; 
const SPRITES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];
const BOMB_SPRITE = 'bomb.png'; // Тебе понадобится картинка бомбы!
 
let board = [];
let score = 0;
let selectedCell = null;
let currentMode = 'classic';
let movesLeft = 30;
let timeLeft = 60;
let gameInterval = null;
let isGameOver = false;
 
// DOM Элементы
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score-display');
const goalEl = document.getElementById('goal-display');
const menuScreen = document.getElementById('menu');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over');
 
// Запуск игры
function startGame(mode) {
    currentMode = mode;
    score = 0;
    isGameOver = false;
    menuScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
 
    if (gameInterval) clearInterval(gameInterval);
 
    if (mode === 'classic') {
        movesLeft = 30;
        goalEl.innerText = `Ходы: ${movesLeft}`;
    } else if (mode === 'bonus') {
        movesLeft = 30;
        goalEl.innerText = `Ходы: ${movesLeft}`;
    } else if (mode === 'survival') {
        timeLeft = 60;
        goalEl.innerText = `⏳: ${timeLeft}с`;
        startTimer();
    } else if (mode === 'vs') {
        timeLeft = 45; // В соревновании 45 секунд
        goalEl.innerText = `⏳: ${timeLeft}с`;
        startTimer();
    }
 
    updateScoreUI();
    createBoard();
}
 
function startTimer() {
    gameInterval = setInterval(() => {
        timeLeft--;
        if (currentMode === 'survival' || currentMode === 'vs') goalEl.innerText = `⏳: ${timeLeft}с`;
        if (timeLeft <= 0) {
            endGame("Время вышло!");
        }
    }, 1000);
}
 
function exitToMenu() {
    if (gameInterval) clearInterval(gameInterval);
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
}
 
function endGame(reason) {
    if (isGameOver) return;
    isGameOver = true;
    if (gameInterval) clearInterval(gameInterval);
 
    document.getElementById('go-title').innerText = reason;
    document.getElementById('go-score').innerText = `Твои очки: ${score}`;
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'flex';
 
    // Если режим соревнования - отправляем результат в бота
    if (currentMode === 'vs') {
        tg.sendData(JSON.stringify({ action: "vs_result", score: score }));
    }
}
 
function updateScoreUI() {
    scoreEl.innerText = `⭐ Очки: ${score}`;
}
 
function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
 
            let type;
            // В режиме бонусов иногда спавним бомбу
            if (currentMode === 'bonus' && Math.random() < 0.05) {
                type = 'bomb';
            } else {
                do { type = Math.floor(Math.random() * TYPES); } 
                while ((c >= 2 && board[r][c-1] === type && board[r][c-2] === type) || (r >= 2 && board[r-1][c] === type && board[r-2][c] === type));
            }
 
            board[r][c] = type;
            updateCell(cell, type);
            cell.addEventListener('click', () => handleCellClick(r, c));
            boardEl.appendChild(cell);
        }
    }
}
 
function updateCell(cell, type) {
    if (type === null) {
        cell.innerHTML = '';
        cell.classList.remove('bomb');
    } else if (type === 'bomb') {
        cell.innerHTML = `<img src="${BOMB_SPRITE}" alt="bomb">`;
        cell.classList.add('bomb');
    } else {
        cell.innerHTML = `<img src="${SPRITES[type]}" alt="fruit">`;
        cell.classList.remove('bomb');
    }
}
 
function handleCellClick(r, c) {
    if (isGameOver) return;
    const cell = boardEl.children[r * COLS + c];
 
    if (!selectedCell) {
        selectedCell = { r, c, el: cell };
        cell.style.transform = 'scale(1.1)';
        cell.style.boxShadow = '0 0 15px white';
    } else {
        selectedCell.el.style.transform = 'scale(1)';
        selectedCell.el.style.boxShadow = 'none';
        const isNeighbor = Math.abs(selectedCell.r - r) + Math.abs(selectedCell.c - c) === 1;
 
        if (isNeighbor) {
            swapCells(selectedCell.r, selectedCell.c, r, c);
        }
        selectedCell = null;
    }
}
 
function swapCells(r1, c1, r2, c2) {
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
    updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
    updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
 
    setTimeout(() => {
        // Проверяем, была ли бомба
        if (board[r1][c1] === 'bomb' || board[r2][c2] === 'bomb') {
            explodeBombs(); // Если бомба сместилась, она взрывается
        } else {
            checkMatches();
        }
    }, 100);
}
 
function explodeBombs() {
    let exploded = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'bomb') {
                exploded = true;
                // Взрываем всё вокруг (радиус 1)
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let nr = r + i, nc = c + j;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            board[nr][nc] = null;
                        }
                    }
                }
            }
        }
    }
 
    if (exploded) {
        score += 100; // Бонус за бомбу
        updateScoreUI();
        setTimeout(() => { dropCells(); }, 300);
    } else {
        checkMatches();
    }
}
 
function checkMatches() {
    let matched = new Set();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            if (board[r][c] !== null && board[r][c] !== 'bomb' && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
                matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`);
            }
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
            if (board[r][c] !== null && board[r][c] !== 'bomb' && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
                matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`);
            }
        }
    }
    if (matched.size > 0) {
        processMatches(matched);
    } else {
        // Если ходов нет и совпадений нет, откатываем (упрощенно)
        if (currentMode === 'classic' || currentMode === 'bonus') {
            movesLeft--;
            goalEl.innerText = `Ходы: ${movesLeft}`;
            if (movesLeft <= 0) endGame("Ходы закончились!");
        }
    }
}
 
function processMatches(matched) {
    let points = matched.size * 10;
    score += points;
    updateScoreUI();
 
    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        board[r][c] = null;
        updateCell(boardEl.children[r * COLS + c], null);
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
            // В бонусном режиме новые бомбы тоже падают
            if (currentMode === 'bonus' && Math.random() < 0.05) board[r][c] = 'bomb';
            else board[r][c] = Math.floor(Math.random() * TYPES);
        }
    }
    renderBoard();
    setTimeout(() => { explodeBombs(); }, 100); // Проверяем, не упали ли бомбы
}
 
function renderBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            updateCell(boardEl.children[r * COLS + c], board[r][c]);
        }
    }
}
