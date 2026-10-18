const tg = window.Telegram.WebApp;
tg.expand();
 
const ROWS = 8;
const COLS = 8;
const TYPES = 6; 
const SPRITES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];
const BOMB_SPRITE = 'bomb.png';
const soundPop = new Audio('pop.mp3');
const soundBoom = new Audio('boom.mp3');
let comboCount = 0;
 
let board = [];
let score = 0;
let currentMode = 'classic';
let movesLeft = 30;
let timeLeft = 60;
let gameInterval = null;
let isGameOver = false;
let isAnimating = false; // Защита от кликов во время анимации
 
// Для свайпов
let touchStartX = 0;
let touchStartY = 0;
let touchStartRow = null;
let touchStartCol = null;
 
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score-display');
const goalEl = document.getElementById('goal-display');
const menuScreen = document.getElementById('menu');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over');
 
function startGame(mode) {
    currentMode = mode;
    score = 0;
    isGameOver = false;
    isAnimating = false;
    menuScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
 
    if (gameInterval) clearInterval(gameInterval);
 
    if (mode === 'classic' || mode === 'bonus') {
        movesLeft = 30;
        goalEl.innerText = `Ходы: ${movesLeft}`;
    } else if (mode === 'survival' || mode === 'vs') {
        timeLeft = mode === 'vs' ? 45 : 60;
        goalEl.innerText = `⏳: ${timeLeft}с`;
        startTimer();
    }
 
    updateScoreUI();
    createBoard();
}
 
function startTimer() {
    gameInterval = setInterval(() => {
        timeLeft--;
        goalEl.innerText = `⏳: ${timeLeft}с`;
        if (timeLeft <= 0) endGame("Время вышло!");
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
            cell.dataset.r = r;
            cell.dataset.c = c;
 
            let type;
            if (currentMode === 'bonus' && Math.random() < 0.05) {
                type = 'bomb';
            } else {
                do { type = Math.floor(Math.random() * TYPES); } 
                while ((c >= 2 && board[r][c-1] === type && board[r][c-2] === type) || (r >= 2 && board[r-1][c] === type && board[r-2][c] === type));
            }
 
            board[r][c] = type;
            updateCell(cell, type);
 
            // Добавляем события для свайпа (Touch и Mouse)
            cell.addEventListener('touchstart', (e) => handleStart(r, c, e), {passive: true});
            cell.addEventListener('touchend', (e) => handleEnd(r, c, e));
            cell.addEventListener('mousedown', (e) => handleStart(r, c, e));
            cell.addEventListener('mouseup', (e) => handleEnd(r, c, e));
 
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
 
// --- ЛОГИКА СВАЙПОВ ---
 
function handleStart(r, c, e) {
    if (isAnimating || isGameOver) return;
 
    // Запоминаем где начали
    if (e.type === 'touchstart') {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    } else {
        touchStartX = e.clientX;
        touchStartY = e.clientY;
    }
    touchStartRow = r;
    touchStartCol = c;
 
    // Подсвечиваем выбранную ячейку
    const cell = boardEl.children[r * COLS + c];
    cell.style.transform = 'scale(1.1)';
    cell.style.boxShadow = '0 0 15px white';
}
 
function handleEnd(r, c, e) {
    if (isAnimating || isGameOver || touchStartRow === null) return;
 
    // Убираем подсветку со стартовой ячейки
    const startCell = boardEl.children[touchStartRow * COLS + touchStartCol];
    startCell.style.transform = 'scale(1)';
    startCell.style.boxShadow = 'none';
 
    let endX, endY;
    if (e.type === 'touchend') {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
    } else {
        endX = e.clientX;
        endY = e.clientY;
    }
 
    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;
 
    // Если свайп был слишком короткий, считаем что это просто тап (ничего не делаем)
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
        touchStartRow = null;
        return;
    }
 
    let targetRow = touchStartRow;
    let targetCol = touchStartCol;
 
    // Определяем направление свайпа
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Горизонтальный свайп
        targetCol += diffX > 0 ? 1 : -1;
    } else {
        // Вертикальный свайп
        targetRow += diffY > 0 ? 1 : -1;
    }
 
    // Проверяем, не вышли ли за границы поля
    if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
        swapCells(touchStartRow, touchStartCol, targetRow, targetCol);
    }
 
    touchStartRow = null;
}
 
// --- ЛОГИКА ИГРЫ ---
 
function swapCells(r1, c1, r2, c2) {
    isAnimating = true;
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
 
    updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
    updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
 
    setTimeout(() => {
        if (board[r1][c1] === 'bomb' || board[r2][c2] === 'bomb') {
            explodeBombs(true); // true = ход был потрачен
        } else {
            let initialMatches = findMatches();
            if (initialMatches.size > 0) {
                // Есть совпадение! Тратим ход и обрабатываем
                if (currentMode === 'classic' || currentMode === 'bonus') {
                    movesLeft--;
                    goalEl.innerText = `Ходы: ${movesLeft}`;
                    if (movesLeft <= 0) {
                        processMatches(initialMatches, false); // false = не конец игры сразу, дадим каскаду упасть
                        setTimeout(() => endGame("Ходы закончились!"), 1000);
                        return;
                    }
                }
                processMatches(initialMatches, true);
            } else {
                // Совпадений нет - откатываем ход
                const temp = board[r1][c1];
                board[r1][c1] = board[r2][c2];
                board[r2][c2] = temp;
                updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
                updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
                isAnimating = false;
            }
        }
    }, 150);
}
 
function findMatches() {
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
    return matched;
}
 
function processMatches(matched, isPlayerMove) {
    // Звук
    soundPop.currentTime = 0;
    soundPop.play().catch(e => {}); 
 
    // Логика комбо (если это не ход игрока, а каскад)
    if (!isPlayerMove) {
        comboCount++;
        if (comboCount > 1) {
            const comboEl = document.getElementById('combo-text');
            comboEl.innerText = `КОМБО x${comboCount}!`;
            comboEl.classList.add('show');
            setTimeout(() => comboEl.classList.remove('show'), 800);
            score += 50 * comboCount; // Бонусные очки
        }
    } else {
        comboCount = 0; // Сбрасываем при новом ходе
    }
 
    let points = matched.size * 10;
    score += points;
    updateScoreUI();
 
    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        const cell = boardEl.children[r * COLS + c];
 
        // Включаем анимацию исчезновения
        cell.classList.add('disappear'); 
 
        setTimeout(() => {
            board[r][c] = null;
            updateCell(cell, null); // Убираем картинку
            cell.classList.remove('disappear'); // Сбрасываем класс
        }, 200); // Ждем 200мс
    });
 
    setTimeout(() => { 
        dropCells(isPlayerMove); 
    }, 250); 
}
 
    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        board[r][c] = null;
        updateCell(boardEl.children[r * COLS + c], null);
    });
 
    setTimeout(() => { 
        dropCells(isPlayerMove); 
    }, 200);
}
 
function explodeBombs(wasPlayerMove) {
    let exploded = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'bomb') {
                exploded = true;
                // Звук взрыва
                soundBoom.currentTime = 0;
                soundBoom.play().catch(e => {}); 
 
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let nr = r + i, nc = c + j;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            const cell = boardEl.children[nr * COLS + nc];
                            cell.classList.add('disappear'); // Анимация взрыва
                            setTimeout(() => {
                                board[nr][nc] = null;
                                updateCell(cell, null);
                                cell.classList.remove('disappear');
                            }, 200);
                        }
                    }
                }
            }
        }
    }
 
    if (exploded) {
        score += 100;
        updateScoreUI();
        setTimeout(() => { dropCells(wasPlayerMove); }, 250);
    } else {
        checkMatchesAfterDrop(wasPlayerMove);
    }
}
                    }
                }
            }
        }
    }
 
    if (exploded) {
        score += 100;
        updateScoreUI();
        setTimeout(() => { dropCells(wasPlayerMove); }, 200);
    } else {
        checkMatchesAfterDrop(wasPlayerMove);
    }
}
 
function dropCells(wasPlayerMove) {
    for (let c = 0; c < COLS; c++) {
        let emptyRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][c] !== null) {
                if (r !== emptyRow) { board[emptyRow][c] = board[r][c]; board[r][c] = null; }
                emptyRow--;
            }
        }
        for (let r = emptyRow; r >= 0; r--) {
            if (currentMode === 'bonus' && Math.random() < 0.05) board[r][c] = 'bomb';
            else board[r][c] = Math.floor(Math.random() * TYPES);
        }
    }
    renderBoard();
    setTimeout(() => { checkMatchesAfterDrop(wasPlayerMove); }, 200);
}
 
function checkMatchesAfterDrop(wasPlayerMove) {
    let hasBomb = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'bomb') hasBomb = true;
        }
    }
 
    if (hasBomb && Math.random() < 0.3) { // Бомбы иногда взрываются сами при падении
        explodeBombs(wasPlayerMove);
        return;
    }
 
    let newMatches = findMatches();
    if (newMatches.size > 0) {
        // Каскадное совпадение! Очки начисляем, но ходы НЕ ТРАТИМ (isPlayerMove = false)
        processMatches(newMatches, false);
    } else {
        isAnimating = false;
        // Если это был бонусный режим и ход игрока, проверим не закончились ли ходы
        if (wasPlayerMove && (currentMode === 'classic' || currentMode === 'bonus') && movesLeft <= 0) {
            endGame("Ходы закончились!");
        }
    }
}
 
function renderBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            updateCell(boardEl.children[r * COLS + c], board[r][c]);
        }
    }
}
