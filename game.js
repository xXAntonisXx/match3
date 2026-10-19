const tg = window.Telegram.WebApp;
tg.expand();

const ROWS = 8;
const COLS = 8;
const TYPES = 6; 
const SPRITES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];
const BOMB_SPRITE = 'bomb.png';
const SUPER_BOMB_SPRITE = 'super_bomb.png'; 
const RAINBOW_SPRITE = 'rainbow.png'; 

const soundPop = new Audio('pop.mp3');
const soundBoom = new Audio('boom.mp3');

let board = [];
let score = 0;
let currentMode = 'classic';
let movesLeft = 30;
let timeLeft = 60;
let gameInterval = null;
let isGameOver = false;
let isAnimating = false; 
let comboCount = 0;

let playerCoins = 100; 
let playerHammers = 0;
let playerShuffles = 0;
let currentLevel = 1;

let goalType = null; 
let goalTarget = 0;
let goalProgress = 0;
let goalFruitIndex = 0; 
let isHammerMode = false;

let touchStartX = 0; let touchStartY = 0;
let touchStartRow = null; let touchStartCol = null;

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score-display');
const goalEl = document.getElementById('goal-display');
const goalTextEl = document.getElementById('goal-text');
const goalProgressEl = document.getElementById('goal-progress');
const menuScreen = document.getElementById('menu');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over');

function sendToBot(data) { tg.sendData(JSON.stringify(data)); }

function loadPlayerData() {
    let savedCoins = localStorage.getItem('match3_coins');
    if (savedCoins !== null) playerCoins = parseInt(savedCoins);
    document.getElementById('hammer-count').innerText = playerHammers;
    document.getElementById('shuffle-count').innerText = playerShuffles;
    sendToBot({ action: "get_data" });
}

function showTop() {
    tg.showAlert("Чтобы увидеть рейтинг всех игроков, нажми кнопку '🏆 Топ игроков' в самом боте или напиши ему команду /top!");
}

function startGame(mode) {
    currentMode = mode;
    score = 0;
    isGameOver = false;
    isAnimating = false;
    isHammerMode = false;
    comboCount = 0;
    menuScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    
    if (gameInterval) clearInterval(gameInterval);

    if (mode === 'classic') {
        movesLeft = 30;
        goalEl.innerText = `Ходы: ${movesLeft}`;
        generateGoal();
    } else if (mode === 'endless') {
        goalEl.innerText = `Ходы: ∞`;
        generateGoal(); 
    } else if (mode === 'survival' || mode === 'vs') {
        timeLeft = mode === 'vs' ? 45 : 60;
        goalEl.innerText = `⏳: ${timeLeft}с`;
        goalTextEl.innerText = "Цель: Продержись!";
        goalProgressEl.innerText = "";
        goalType = null;
        startTimer();
    }
    updateScoreUI();
    createBoard();
}

function generateGoal() {
    if (currentMode === 'classic' && currentLevel % 3 === 0) {
        goalType = 'score';
        goalTarget = 500 * currentLevel;
        goalTextEl.innerText = `Цель: Набери ${goalTarget} очков`;
        goalProgress = 0;
    } else {
        goalType = 'fruit';
        goalFruitIndex = Math.floor(Math.random() * TYPES);
        let baseTarget = currentMode === 'endless' ? 15 : 10;
        goalTarget = baseTarget + (currentLevel * 3); 
        goalTextEl.innerHTML = `Цель: Собери ${goalTarget} <img src="${SPRITES[goalFruitIndex]}" style="width: 20px; vertical-align: middle;">`;
        goalProgress = 0;
    }
    updateGoalUI();
}

function updateGoalUI() {
    if (goalType === 'score') goalProgressEl.innerText = `${score} / ${goalTarget}`;
    else if (goalType === 'fruit') goalProgressEl.innerText = `${goalProgress} / ${goalTarget}`;
}

function checkGoalComplete() {
    if (currentMode === 'classic') {
        if ((goalType === 'score' && score >= goalTarget) || (goalType === 'fruit' && goalProgress >= goalTarget)) {
            endGame("🎉 Уровень пройден!");
            return true;
        }
    } else if (currentMode === 'endless') {
        if (goalType === 'fruit' && goalProgress >= goalTarget) {
            currentLevel++; score += 500; 
            playerCoins += 30; localStorage.setItem('match3_coins', playerCoins);
            sendToBot({ action: "endless_goal", reward: 30 });
            tg.showAlert("🎉 Цель выполнена! Получено 30 монет! Новая цель!");
            generateGoal(); return false; 
        }
    }
    return false;
}

function useBooster(type) {
    if (isAnimating || isGameOver) return;
    if (type === 'hammer') {
        if (playerHammers > 0) {
            isHammerMode = !isHammerMode; 
            if (isHammerMode) tg.showAlert("Режим молотка ВКЛ. Нажми на фишку!");
            else tg.showAlert("Режим молотка ВЫКЛ.");
        } else tg.showAlert("У тебя нет молотков! Купи их в магазине.");
    } else if (type === 'shuffle') {
        if (playerShuffles > 0) {
            playerShuffles--; document.getElementById('shuffle-count').innerText = playerShuffles;
            createBoard(); sendToBot({ action: "spend_booster", booster: "shuffle" });
        } else tg.showAlert("У тебя нет перемешиваний! Купи их в магазине.");
    }
}

function openShop() {
    tg.showPopup({
        title: "Магазин",
        message: `Твои монеты: ${playerCoins}\n\nЧто купить?`,
        buttons: [
            {id: "buy_hammer", type: "default", text: "🔨 Молоток (50 монет)"},
            {id: "buy_shuffle", type: "default", text: "🔄 Перемешать (30 монет)"},
            {id: "cancel", type: "cancel"}
        ]
    }, (buttonId) => {
        if (buttonId === "buy_hammer") {
            if (playerCoins >= 50) {
                playerCoins -= 50; localStorage.setItem('match3_coins', playerCoins);
                playerHammers++; document.getElementById('hammer-count').innerText = playerHammers;
                sendToBot({ action: "buy_booster", booster: "hammer", cost: 50 });
                tg.showAlert("✅ Куплен молоток!");
            } else tg.showAlert("❌ Недостаточно монет!");
        } else if (buttonId === "buy_shuffle") {
            if (playerCoins >= 30) {
                playerCoins -= 30; localStorage.setItem('match3_coins', playerCoins);
                playerShuffles++; document.getElementById('shuffle-count').innerText = playerShuffles;
                sendToBot({ action: "buy_booster", booster: "shuffle", cost: 30 });
                tg.showAlert("✅ Куплено перемешивание!");
            } else tg.showAlert("❌ Недостаточно монет!");
        }
    });
}

function startTimer() {
    gameInterval = setInterval(() => {
        timeLeft--; goalEl.innerText = `⏳: ${timeLeft}с`;
        if (timeLeft <= 0) endGame("Время вышло!");
    }, 1000);
}

function exitToMenu() {
    // Если игрок выходит в меню из режима соревнования, сохраняем результат
    if (currentMode === 'vs' && score > 0) {
        sendToBot({ action: "update_score", score: score });
    }
    if (gameInterval) clearInterval(gameInterval);
    gameScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; menuScreen.style.display = 'flex';
}

function endGame(reason) {
    if (isGameOver) return;
    isGameOver = true;
    if (gameInterval) clearInterval(gameInterval);
    
    if (currentMode === 'classic' && reason === "🎉 Уровень пройден!") {
        currentLevel++;
        playerCoins += 50; localStorage.setItem('match3_coins', playerCoins);
        sendToBot({ action: "level_complete", level: currentLevel, reward: 50 });
        document.getElementById('go-title').innerText = reason;
        document.getElementById('go-score').innerText = `Твои очки: ${score}\n💰 Получено 50 монет!`;
    } else {
        document.getElementById('go-title').innerText = reason;
        document.getElementById('go-score').innerText = `Твои очки: ${score}`;
    }

    gameScreen.style.display = 'none'; gameOverScreen.style.display = 'flex';
    
    // ОТПРАВЛЯЕМ РЕКОРД В БОТ
    if (currentMode === 'vs') {
        sendToBot({ action: "update_score", score: score });
    }
}

function updateScoreUI() { scoreEl.innerText = `⭐ Очки: ${score}`; }

function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            let type = Math.floor(Math.random() * TYPES);
            while ((c >= 2 && board[r][c-1] === type && board[r][c-2] === type) || 
                   (r >= 2 && board[r-1][c] === type && board[r-2][c] === type)) {
                type = Math.floor(Math.random() * TYPES);
            }
            board[r][c] = type;
            updateCell(cell, type);
            cell.addEventListener('touchstart', (e) => { if (isHammerMode) handleHammer(r, c); else handleStart(r, c, e); }, {passive: true});
            cell.addEventListener('touchend', (e) => { if (!isHammerMode) handleEnd(r, c, e); });
            cell.addEventListener('mousedown', (e) => { if (isHammerMode) handleHammer(r, c); else handleStart(r, c, e); });
            cell.addEventListener('mouseup', (e) => { if (!isHammerMode) handleEnd(r, c, e); });
            boardEl.appendChild(cell);
        }
    }
}

function handleHammer(r, c) {
    if (!isHammerMode) return;
    isHammerMode = false; isAnimating = true;
    playerHammers--; document.getElementById('hammer-count').innerText = playerHammers;
    sendToBot({ action: "spend_booster", booster: "hammer" });
    soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
    
    let cellsDestroyed = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let nr = r + i, nc = c + j;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                const cell = boardEl.children[nr * COLS + nc];
                cell.classList.add('disappear');
                setTimeout(() => { board[nr][nc] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
            }
        }
    }
    if (goalType === 'fruit') {
        cellsDestroyed.forEach(cd => { if (cd.type === goalFruitIndex) goalProgress++; });
        updateGoalUI(); checkGoalComplete();
    }
    setTimeout(() => { dropCells(true); }, 250);
}

function updateCell(cell, type) {
    if (type === null) { cell.innerHTML = ''; cell.classList.remove('bomb', 'rainbow', 'super-bomb'); } 
    else if (type === 'bomb') { cell.innerHTML = `<img src="${BOMB_SPRITE}" alt="bomb">`; cell.classList.add('bomb'); cell.classList.remove('rainbow', 'super-bomb'); } 
    else if (type === 'super_bomb') { cell.innerHTML = `<img src="${SUPER_BOMB_SPRITE}" alt="super_bomb">`; cell.classList.add('super-bomb'); cell.classList.remove('rainbow', 'bomb'); } 
    else if (type === 'rainbow') { cell.innerHTML = `<img src="${RAINBOW_SPRITE}" alt="rainbow">`; cell.classList.add('rainbow'); cell.classList.remove('bomb', 'super-bomb'); }
    else { cell.innerHTML = `<img src="${SPRITES[type]}" alt="fruit">`; cell.classList.remove('bomb', 'rainbow', 'super-bomb'); }
}

function handleStart(r, c, e) {
    if (isAnimating || isGameOver) return;
    if (e.type === 'touchstart') { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; } 
    else { touchStartX = e.clientX; touchStartY = e.clientY; }
    touchStartRow = r; touchStartCol = c;
    const cell = boardEl.children[r * COLS + c];
    cell.style.transform = 'scale(1.1)'; cell.style.boxShadow = '0 0 15px white';
}

function handleEnd(r, c, e) {
    if (isAnimating || isGameOver || touchStartRow === null) return;
    const startCell = boardEl.children[touchStartRow * COLS + touchStartCol];
    startCell.style.transform = 'scale(1)'; startCell.style.boxShadow = 'none';
    let endX, endY;
    if (e.type === 'touchend') { endX = e.changedTouches[0].clientX; endY = e.changedTouches[0].clientY; } 
    else { endX = e.clientX; endY = e.clientY; }
    const diffX = endX - touchStartX; const diffY = endY - touchStartY;
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) { touchStartRow = null; return; }
    let targetRow = touchStartRow; let targetCol = touchStartCol;
    if (Math.abs(diffX) > Math.abs(diffY)) { targetCol += diffX > 0 ? 1 : -1; } 
    else { targetRow += diffY > 0 ? 1 : -1; }
    if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) { swapCells(touchStartRow, touchStartCol, targetRow, targetCol); }
    touchStartRow = null;
}

function swapCells(r1, c1, r2, c2) {
    isAnimating = true;
    const temp = board[r1][c1]; board[r1][c1] = board[r2][c2]; board[r2][c2] = temp;
    updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
    updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
    
    setTimeout(() => {
        if (board[r1][c1] === 'bomb' || board[r2][c2] === 'bomb' || 
            board[r1][c1] === 'super_bomb' || board[r2][c2] === 'super_bomb' ||
            board[r1][c1] === 'rainbow' || board[r2][c2] === 'rainbow') {
            handleSpecialMove(r1, c1, r2, c2); 
        } else {
            let initialMatches = findMatches();
            if (initialMatches.size > 0) {
                if (currentMode === 'classic') {
                    movesLeft--; goalEl.innerText = `Ходы: ${movesLeft}`;
                    if (movesLeft <= 0) { processMatches(initialMatches, true); setTimeout(() => endGame("Ходы закончились!"), 1000); return; }
                }
                processMatches(initialMatches, true);
            } else {
                const temp = board[r1][c1]; board[r1][c1] = board[r2][c2]; board[r2][c2] = temp;
                updateCell(boardEl.children[r1 * COLS + c1], board[r1][c1]);
                updateCell(boardEl.children[r2 * COLS + c2], board[r2][c2]);
                isAnimating = false;
            }
        }
    }, 150);
}

function handleSpecialMove(r1, c1, r2, c2) {
    let t1 = board[r1][c1], t2 = board[r2][c2];
    let cellsDestroyed = [];
    
    if ((t1 === 'bomb' || t1 === 'super_bomb') && (t2 === 'bomb' || t2 === 'super_bomb')) {
        soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
        tg.showAlert("💥 ДВОЙНОЙ ВЗРЫВ!");
        let rA = r1, cA = c1, rB = r2, cB = c2;
        board[rA][cA] = null; board[rB][cB] = null;
        let radA = t1 === 'super_bomb' ? 2 : 1;
        for (let i = -radA; i <= radA; i++) {
            for (let j = -radA; j <= radA; j++) {
                let nr = rA + i, nc = cA + j;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                    const cell = boardEl.children[nr * COLS + nc];
                    cell.classList.add('disappear');
                    setTimeout(() => { board[nr][nc] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
                }
            }
        }
        let radB = t2 === 'super_bomb' ? 2 : 1;
        for (let i = -radB; i <= radB; i++) {
            for (let j = -radB; j <= radB; j++) {
                let nr = rB + i, nc = cB + j;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                    const cell = boardEl.children[nr * COLS + nc];
                    cell.classList.add('disappear');
                    setTimeout(() => { board[nr][nc] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
                }
            }
        }
    } 
    else if (t1 === 'rainbow' && t2 === 'rainbow') {
        soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
        tg.showAlert("🌈 АБСОЛЮТНАЯ ОЧИСТКА!");
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                cellsDestroyed.push({r: r, c: c, type: board[r][c]});
                const cell = boardEl.children[r * COLS + c];
                cell.classList.add('disappear');
                setTimeout(() => { board[r][c] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
            }
        }
    }
    else if ((t1 === 'rainbow' && (t2 === 'bomb' || t2 === 'super_bomb')) || (t2 === 'rainbow' && (t1 === 'bomb' || t1 === 'super_bomb'))) {
        soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
        tg.showAlert("🌈💥 АБСОЛЮТНАЯ ОЧИСТКА!");
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                cellsDestroyed.push({r: r, c: c, type: board[r][c]});
                const cell = boardEl.children[r * COLS + c];
                cell.classList.add('disappear');
                setTimeout(() => { board[r][c] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
            }
        }
    }
    else {
        let specialType = null, sr = 0, sc = 0, targetType = null;
        if (t1 === 'bomb' || t1 === 'super_bomb' || t1 === 'rainbow') {
            specialType = t1; sr = r1; sc = c1; targetType = t2;
        } else {
            specialType = t2; sr = r2; sc = c2; targetType = t1;
        }

        if (specialType === 'bomb' || specialType === 'super_bomb') {
            soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
            board[sr][sc] = null;
            let radius = specialType === 'super_bomb' ? 2 : 1;
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    let nr = sr + i, nc = sc + j;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                        const cell = boardEl.children[nr * COLS + nc];
                        cell.classList.add('disappear');
                        setTimeout(() => { board[nr][nc] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
                    }
                }
            }
        } else if (specialType === 'rainbow') {
            soundPop.currentTime = 0; soundPop.play().catch(e => {});
            board[sr][sc] = null;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c] === targetType) {
                        cellsDestroyed.push({r: r, c: c, type: board[r][c]});
                        const cell = boardEl.children[r * COLS + c];
                        cell.classList.add('disappear');
                        setTimeout(() => { board[r][c] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
                    }
                }
            }
        }
    }
    
    if (goalType === 'fruit') {
        cellsDestroyed.forEach(cd => { if (cd.type === goalFruitIndex) goalProgress++; });
        updateGoalUI(); checkGoalComplete();
    }
    score += cellsDestroyed.length * 10;
    updateScoreUI();
    setTimeout(() => { dropCells(true); }, 300);
}

function explodeBombs(wasPlayerMove) { 
    let explodedAny = false;
    let queue = []; 

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'bomb' || board[r][c] === 'super_bomb') {
                queue.push({r: r, c: c, type: board[r][c]});
                board[r][c] = null;
            }
        }
    }

    if (queue.length > 0) {
        soundBoom.currentTime = 0; soundBoom.play().catch(e => {});
        while (queue.length > 0) {
            let b = queue.shift();
            explodedAny = true;
            let radius = b.type === 'super_bomb' ? 2 : 1;
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    let nr = b.r + i, nc = b.c + j;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        if (board[nr][nc] === 'bomb' || board[nr][nc] === 'super_bomb') {
                            queue.push({r: nr, c: nc, type: board[nr][nc]});
                            board[nr][nc] = null;
                        }
                        const cell = boardEl.children[nr * COLS + nc];
                        cell.classList.add('disappear'); 
                        setTimeout(() => { 
                            if(board[nr][nc] !== null) {
                                board[nr][nc] = null; 
                                updateCell(cell, null); 
                            }
                            cell.classList.remove('disappear'); 
                        }, 200);
                    }
                }
            }
        }
        score += 100; updateScoreUI(); setTimeout(() => { dropCells(wasPlayerMove); }, 300); 
    } 
    else { checkMatchesAfterDrop(wasPlayerMove); }
}

function findMatches() {
    let matched = new Set();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            if (board[r][c] !== null && board[r][c] !== 'bomb' && board[r][c] !== 'rainbow' && board[r][c] !== 'super_bomb' && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
                matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`);
            }
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
            if (board[r][c] !== null && board[r][c] !== 'bomb' && board[r][c] !== 'rainbow' && board[r][c] !== 'super_bomb' && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
                matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`);
            }
        }
    }
    return matched;
}

function processMatches(matched, isPlayerMove) {
    soundPop.currentTime = 0; soundPop.play().catch(e => {}); 
    if (!isPlayerMove) {
        comboCount++;
        if (comboCount > 1) {
            const comboEl = document.getElementById('combo-text');
            comboEl.innerText = `КОМБО x${comboCount}!`; comboEl.classList.add('show');
            setTimeout(() => comboEl.classList.remove('show'), 800);
            score += 50 * comboCount;
        }
    } else { comboCount = 0; }
    
    let lines = [];
    for (let r = 0; r < ROWS; r++) {
        let count = 1;
        for (let c = 1; c <= COLS; c++) {
            if (c < COLS && board[r][c] !== null && board[r][c] === board[r][c-1] && board[r][c] !== 'bomb' && board[r][c] !== 'rainbow' && board[r][c] !== 'super_bomb') count++;
            else {
                if (count >= 3) {
                    let line = [];
                    for(let i=0; i<count; i++) line.push({r: r, c: c-1-i});
                    lines.push({cells: line, type: board[r][c-1], count: count, dir: 'h'});
                }
                count = 1;
            }
        }
    }
    for (let c = 0; c < COLS; c++) {
        let count = 1;
        for (let r = 1; r <= ROWS; r++) {
            if (r < ROWS && board[r][c] !== null && board[r][c] === board[r-1][c] && board[r][c] !== 'bomb' && board[r][c] !== 'rainbow' && board[r][c] !== 'super_bomb') count++;
            else {
                if (count >= 3) {
                    let line = [];
                    for(let i=0; i<count; i++) line.push({r: r-1-i, c: c});
                    lines.push({cells: line, type: board[r-1][c], count: count, dir: 'v'});
                }
                count = 1;
            }
        }
    }

    let spawns = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = 0; j < lines.length; j++) {
            if (i !== j && lines[i].type === lines[j].type) {
                let intersection = lines[i].cells.find(c1 => lines[j].cells.some(c2 => c1.r === c2.r && c1.c === c2.c));
                if (intersection) {
                    spawns.push({r: intersection.r, c: intersection.c, type: 'super_bomb'});
                    lines[i].processed = true; lines[j].processed = true;
                }
            }
        }
    }

    lines.forEach(line => {
        if (line.processed) return;
        if (line.count === 4) {
            let mid = line.cells[1];
            spawns.push({r: mid.r, c: mid.c, type: 'bomb'});
        } else if (line.count >= 5) {
            let mid = line.cells[2];
            spawns.push({r: mid.r, c: mid.c, type: 'rainbow'});
        }
    });

    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        if (!spawns.find(s => s.r === r && s.c === c)) {
            const cell = boardEl.children[r * COLS + c];
            cell.classList.add('disappear'); 
            setTimeout(() => { board[r][c] = null; updateCell(cell, null); cell.classList.remove('disappear'); }, 200);
        }
    });

    spawns.forEach(s => {
        board[s.r][s.c] = s.type;
        updateCell(boardEl.children[s.r * COLS + s.c], s.type);
    });

    if (goalType === 'fruit') {
        matched.forEach(pos => { const [r, c] = pos.split(',').map(Number); if (board[r][c] === goalFruitIndex) goalProgress++; });
        updateGoalUI(); checkGoalComplete();
    }

    let points = matched.size * 10; score += points; updateScoreUI();
    if (goalType === 'score') updateGoalUI();

    setTimeout(() => { dropCells(isPlayerMove); }, 250); 
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
            board[r][c] = Math.floor(Math.random() * TYPES);
        }
    }
    renderBoard();
    setTimeout(() => { checkMatchesAfterDrop(wasPlayerMove); }, 200);
}

function checkMatchesAfterDrop(wasPlayerMove) {
    let newMatches = findMatches();
    if (newMatches.size > 0) { processMatches(newMatches, false); } 
    else {
        isAnimating = false;
        if (wasPlayerMove && currentMode === 'classic' && movesLeft <= 0) { 
            if (!checkGoalComplete()) endGame("Ходы закончились!"); 
        }
    }
}

function renderBoard() {
    for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { updateCell(boardEl.children[r * COLS + c], board[r][c]); } }
}

loadPlayerData();
