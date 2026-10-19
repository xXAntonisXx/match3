const tg = window.Telegram.WebApp;
tg.expand();

document.getElementById('app').innerHTML = `
<style>
    body { margin: 0; background: #1a1a2e; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; height: 100vh; overflow: hidden; user-select: none; }
    #menu { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; padding: 20px; box-sizing: border-box; }
    h1 { font-size: 32px; margin-bottom: 10px; color: #4ecca3; text-align: center; }
    p { color: #aaa; margin-bottom: 30px; }
    .menu-btn { background: rgba(255,255,255,0.1); color: white; border: 2px solid rgba(255,255,255,0.2); padding: 15px 30px; margin: 10px; border-radius: 15px; font-size: 18px; font-weight: bold; width: 80%; max-width: 300px; cursor: pointer; display: flex; justify-content: space-between; }
    #game-screen { display: none; flex-direction: column; align-items: center; width: 100%; height: 100%; }
    #level-goal { margin-top: 10px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; text-align: center; width: 90%; max-width: 400px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; width: 90%; max-width: 400px; margin-top: 10px; font-size: 18px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; box-sizing: border-box; }
    .board { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; width: 90vw; max-width: 400px; aspect-ratio: 1/1; margin-top: 15px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 15px; }
    .cell { display: flex; justify-content: center; align-items: center; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; }
    .cell img { width: 80%; height: 80%; object-fit: contain; pointer-events: none; }
    .boosters { display: flex; justify-content: space-between; width: 90%; max-width: 400px; margin-top: 15px; gap: 10px; }
    button.action { background: rgba(255,255,255,0.1); color: white; border: 1px solid #4ecca3; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; }
    .btn-hammer { flex: 1; background: #9b59b6; border: none; }
    .btn-shuffle { flex: 1; background: #3498db; border: none; }
    .btn-menu { width: 90%; max-width: 400px; margin-top: 10px; background: #e94560; border: none; padding: 12px; font-weight: bold; }
    .btn-shop { width: 90%; max-width: 400px; margin-top: 10px; background: #f39c12; border: none; color: #1a1a2e; padding: 12px; font-weight: bold; }

    #shop-modal { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 200; flex-direction: column; align-items: center; justify-content: center; }
    .shop-item { background: rgba(255,255,255,0.1); border: 1px solid #4ecca3; padding: 15px; margin: 10px; border-radius: 10px; width: 80%; max-width: 300px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .shop-item:hover { background: rgba(255,255,255,0.2); }

    #donate-modal { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 300; flex-direction: column; align-items: center; justify-content: center; }

    #game-over { display: none; flex-direction: column; align-items: center; justify-content: center; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10; }
    #combo-text { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: 30px; font-weight: bold; color: #ffcc00; text-shadow: 0 0 10px #ff0000; opacity: 0; pointer-events: none; transition: all 0.3s; z-index: 100; text-align: center; width: 80%; }
    #combo-text.show { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
</style>
<div id="menu">
    <h1>🍉 Match 3 Pro</h1>
    <p>Выбери режим игры:</p>
    <button class="menu-btn" onclick="startGame('classic')"><span>🎯 Классика</span> <span>Уровни</span></button>
    <button class="menu-btn" onclick="startGame('endless')"><span>♾️ Бесконечный</span> <span>Цели</span></button>
    <button class="menu-btn" onclick="startGame('survival')"><span>⏳ Выживание</span> <span>60 сек</span></button>
    <button class="menu-btn" onclick="startGame('vs')"><span>⚔️ Соревнование</span> <span>На время</span></button>
    <button class="menu-btn" style="background: #8e44ad; border-color: #8e44ad;" onclick="showTop()"><span>🏆 Топ игроков</span> <span>Рекорды</span></button>
</div>
<div id="game-screen">
    <div id="level-goal"><div id="goal-text">Цель</div><div id="goal-progress">0 / 15</div></div>
    <div class="header"><span id="score-display">⭐ Очки: 0</span><span id="goal-display">Ходы: 30</span></div>
    <div class="board" id="board"></div>
    <div class="boosters">
        <button class="action btn-hammer" onclick="useBooster('hammer')">🔨 Молоток (<span id="hammer-count">0</span>)</button>
        <button class="action btn-shuffle" onclick="useBooster('shuffle')">🔄 Микс (<span id="shuffle-count">0</span>)</button>
    </div>
    <button class="action btn-shop" onclick="openShop()">💎 Магазин</button>
    <button class="action btn-menu" onclick="exitToMenu()">⬅️ В меню</button>
</div>

<div id="shop-modal">
    <h2 style="color: #f39c12;">Магазин</h2>
    <p>Твои монеты: <span id="shop-coins">100</span></p>
    <div class="shop-item" onclick="buyItem('hammer', 50)">
        <span>🔨 Молоток (3х3)</span>
        <span style="color: #4ecca3; font-weight: bold;">50 🪙</span>
    </div>
    <div class="shop-item" onclick="buyItem('shuffle', 30)">
        <span>🔄 Перемешать поле</span>
        <span style="color: #4ecca3; font-weight: bold;">30 🪙</span>
    </div>
    <div class="shop-item" style="background: rgba(243, 156, 18, 0.2); border-color: #f39c12;" onclick="openDonate()">
        <span>⭐ Купить монеты за Stars</span>
        <span style="color: #f39c12; font-weight: bold;">Донат</span>
    </div>
    <button class="menu-btn" style="margin-top: 20px; justify-content: center;" onclick="closeShop()">Закрыть</button>
</div>

<div id="donate-modal">
    <h2 style="color: #f39c12;">Покупка монет</h2>
    <div class="shop-item" onclick="buyStars(500, 10)">
        <span>🪙 500 монет</span>
        <span style="color: #f39c12; font-weight: bold;">10 ⭐</span>
    </div>
    <div class="shop-item" onclick="buyStars(1500, 25)">
        <span>🪙 1500 монет</span>
        <span style="color: #f39c12; font-weight: bold;">25 ⭐</span>
    </div>
    <button class="menu-btn" style="margin-top: 20px; justify-content: center;" onclick="closeDonate()">Назад</button>
</div>

<div id="combo-text"></div>
<div id="game-over"><h1 id="go-title">Игра окончена!</h1><p id="go-score" style="font-size: 24px; color: #4ecca3;">Очки: 0</p><button class="menu-btn" style="justify-content: center;" onclick="exitToMenu()">В меню</button></div>
`;

const ROWS = 8;
const COLS = 8;
const TYPES = 6; 
const SPRITES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];
const BOMB_SPRITE = 'bomb.png';
const RAINBOW_SPRITE = 'rainbow.png'; 
const ROCKET_SPRITE = 'rocket.png'; 

let soundPop, soundBoom;
try {
    soundPop = new Audio('pop.mp3');
    soundBoom = new Audio('boom.mp3');
} catch (e) {}

let board = [];
let score = 0;
let currentMode = 'classic';
let movesLeft = 30;
let timeLeft = 60;
let gameInterval = null;
let isGameOver = false;
let isAnimating = false; 
let comboCount = 0;
let playerCoins = 100, playerHammers = 0, playerShuffles = 0, currentLevel = 1;
let goalType = null, goalTarget = 0, goalProgress = 0, goalFruitIndex = 0, isHammerMode = false;
let touchStartX = 0, touchStartY = 0, touchStartRow = null, touchStartCol = null;

function sendToBot(data) { tg.sendData(JSON.stringify(data)); }
function loadPlayerData() {
    let savedCoins = localStorage.getItem('match3_coins');
    if (savedCoins !== null) playerCoins = parseInt(savedCoins);
    document.getElementById('hammer-count').innerText = playerHammers;
    document.getElementById('shuffle-count').innerText = playerShuffles;
    document.getElementById('shop-coins').innerText = playerCoins;
}

// ПЕРЕХОД В БОТА ДЛЯ ТОПА
function showTop() {
    let botUsername = "Match3Pro_bot"; // ВСТАВЬ СЮДА СВОЙ USERNAME БЕЗ @
    let url = `https://t.me/${botUsername}?start=top`;
    tg.openTelegramLink(url);
}

function openShop() { document.getElementById('shop-coins').innerText = playerCoins; document.getElementById('shop-modal').style.display = 'flex'; }
function closeShop() { document.getElementById('shop-modal').style.display = 'none'; }
function openDonate() { document.getElementById('donate-modal').style.display = 'flex'; }
function closeDonate() { document.getElementById('donate-modal').style.display = 'none'; }

// ПЕРЕХОД В БОТА ДЛЯ ДОНАТА
function buyStars(amount, stars) {
    let botUsername = "Match3Pro_bot"; // ВСТАВЬ СЮДА СВОЙ USERNAME БЕЗ @
    let url = `https://t.me/${botUsername}?start=pay_${amount}`;
    tg.openTelegramLink(url);
}

function buyItem(type, cost) {
    if (playerCoins >= cost) {
        playerCoins -= cost; localStorage.setItem('match3_coins', playerCoins);
        document.getElementById('shop-coins').innerText = playerCoins;
        if (type === 'hammer') { playerHammers++; document.getElementById('hammer-count').innerText = playerHammers; sendToBot({ action: "buy_booster", booster: "hammer", cost: cost }); } 
        else if (type === 'shuffle') { playerShuffles++; document.getElementById('shuffle-count').innerText = playerShuffles; sendToBot({ action: "buy_booster", booster: "shuffle", cost: cost }); }
        const comboEl = document.getElementById('combo-text');
        comboEl.innerText = "КУПЛЕНО!"; comboEl.classList.add('show');
        setTimeout(() => comboEl.classList.remove('show'), 1000);
    } else {
        const comboEl = document.getElementById('combo-text');
        comboEl.innerText = "НЕДОСТАТОЧНО МОНЕТ!"; comboEl.classList.add('show');
        setTimeout(() => comboEl.classList.remove('show'), 1000);
    }
}

function startGame(mode) {
    currentMode = mode; score = 0; isGameOver = false; isAnimating = false; isHammerMode = false; comboCount = 0;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    if (gameInterval) clearInterval(gameInterval);
    if (mode === 'classic' || mode === 'endless') {
        movesLeft = mode === 'classic' ? 30 : 999;
        document.getElementById('goal-display').innerText = mode === 'classic' ? `Ходы: ${movesLeft}` : `Ходы: ∞`;
        generateGoal();
    } else {
        timeLeft = mode === 'vs' ? 45 : 60;
        document.getElementById('goal-display').innerText = `⏳: ${timeLeft}с`;
        document.getElementById('goal-text').innerText = "Цель: Продержись!";
        document.getElementById('goal-progress').innerText = "";
        goalType = null; startTimer();
    }
    updateScoreUI(); createBoard();
}

function generateGoal() {
    if (currentMode === 'classic' && currentLevel % 3 === 0) {
        goalType = 'score'; goalTarget = 500 * currentLevel;
        document.getElementById('goal-text').innerText = `Цель: Набери ${goalTarget} очков`;
    } else {
        goalType = 'fruit'; goalFruitIndex = Math.floor(Math.random() * TYPES);
        goalTarget = (currentMode === 'endless' ? 15 : 10) + (currentLevel * 3); 
        document.getElementById('goal-text').innerHTML = `Цель: Собери ${goalTarget} <img src="${SPRITES[goalFruitIndex]}" style="width: 20px; vertical-align: middle;">`;
    }
    goalProgress = 0; updateGoalUI();
}

function updateGoalUI() {
    if (goalType === 'score') document.getElementById('goal-progress').innerText = `${score} / ${goalTarget}`;
    else if (goalType === 'fruit') document.getElementById('goal-progress').innerText = `${goalProgress} / ${goalTarget}`;
}

function checkGoalComplete() {
    if (currentMode === 'classic' && ((goalType === 'score' && score >= goalTarget) || (goalType === 'fruit' && goalProgress >= goalTarget))) {
        endGame("🎉 Уровень пройден!"); return true;
    } else if (currentMode === 'endless' && goalType === 'fruit' && goalProgress >= goalTarget) {
        currentLevel++; score += 500; playerCoins += 1; localStorage.setItem('match3_coins', playerCoins);
        sendToBot({ action: "endless_goal", reward: 1 });
        
        const comboEl = document.getElementById('combo-text');
        comboEl.innerText = "ЦЕЛЬ ВЫПОЛНЕНА! +1 🪙";
        comboEl.classList.add('show');
        setTimeout(() => comboEl.classList.remove('show'), 1500);
        setTimeout(() => { generateGoal(); }, 300); 
        return false; 
    }
    return false;
}

function useBooster(type) {
    if (isAnimating || isGameOver) return;
    if (type === 'hammer') {
        if (playerHammers > 0) { isHammerMode = !isHammerMode; tg.showAlert(isHammerMode ? "Молоток ВКЛ" : "Молоток ВЫКЛ"); }
        else tg.showAlert("Нет молотков!");
    } else if (type === 'shuffle') {
        if (playerShuffles > 0) { playerShuffles--; document.getElementById('shuffle-count').innerText = playerShuffles; createBoard(); sendToBot({ action: "spend_booster", booster: "shuffle" }); }
        else tg.showAlert("Нет перемешиваний!");
    }
}

function startTimer() {
    gameInterval = setInterval(() => {
        timeLeft--; document.getElementById('goal-display').innerText = `⏳: ${timeLeft}с`;
        if (timeLeft <= 0) endGame("Время вышло!");
    }, 1000);
}

function exitToMenu() {
    if (gameInterval) clearInterval(gameInterval);
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

function endGame(reason) {
    if (isGameOver) return; isGameOver = true; if (gameInterval) clearInterval(gameInterval);
    if (currentMode === 'classic' && reason === "🎉 Уровень пройден!") {
        currentLevel++; playerCoins += 5; localStorage.setItem('match3_coins', playerCoins);
        sendToBot({ action: "level_complete", level: currentLevel, reward: 5 });
        document.getElementById('go-title').innerText = reason;
        document.getElementById('go-score').innerText = `Очки: ${score}\n💰 +5 монет!`;
    } else {
        document.getElementById('go-title').innerText = reason;
        document.getElementById('go-score').innerText = `Очки: ${score}`;
    }
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';
    
    // ОТПРАВЛЯЕМ РЕКОРД В БОТА ПРИ ОКОНЧАНИИ СОРЕВНОВАНИЯ
    if (currentMode === 'vs') {
        sendToBot({ action: "update_score", score: score });
    }
}

function updateScoreUI() { document.getElementById('score-display').innerText = `⭐ Очки: ${score}`; }

function createBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div'); cell.classList.add('cell');
            let type = Math.floor(Math.random() * TYPES);
            while ((c >= 2 && board[r][c-1] === type && board[r][c-2] === type) || (r >= 2 && board[r-1][c] === type && board[r-2][c] === type)) type = Math.floor(Math.random() * TYPES);
            board[r][c] = type; updateCell(cell, type);
            cell.addEventListener('touchstart', (e) => { if (isHammerMode) handleHammer(r, c); else handleStart(r, c, e); }, {passive: true});
            cell.addEventListener('touchend', (e) => { if (!isHammerMode) handleEnd(r, c, e); });
            cell.addEventListener('mousedown', (e) => { if (isHammerMode) handleHammer(r, c); else handleStart(r, c, e); });
            cell.addEventListener('mouseup', (e) => { if (!isHammerMode) handleEnd(r, c, e); });
            boardEl.appendChild(cell);
        }
    }
}

function handleHammer(r, c) {
    if (!isHammerMode) return; isHammerMode = false; isAnimating = true;
    playerHammers--; document.getElementById('hammer-count').innerText = playerHammers;
    sendToBot({ action: "spend_booster", booster: "hammer" });
    if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
    let cellsDestroyed = [];
    
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let nr = r + i, nc = c + j;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                board[nr][nc] = null;
                const cell = document.getElementById('board').children[nr * COLS + nc];
                cell.classList.add('disappear');
            }
        }
    }
    if (goalType === 'fruit') { cellsDestroyed.forEach(cd => { if (cd.type === goalFruitIndex) goalProgress++; }); updateGoalUI(); checkGoalComplete(); }
    
    setTimeout(() => { 
        document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear'));
        dropCells(true); 
    }, 200);
}

function updateCell(cell, type) {
    if (type === null) { cell.innerHTML = ''; } 
    else if (type === 'bomb') { cell.innerHTML = `<img src="${BOMB_SPRITE}">`; } 
    else if (type === 'rainbow') { cell.innerHTML = `<img src="${RAINBOW_SPRITE}">`; }
    else if (type === 'rocket_h') { cell.innerHTML = `<img src="${ROCKET_SPRITE}" style="transform: rotate(0deg);">`; }
    else if (type === 'rocket_v') { cell.innerHTML = `<img src="${ROCKET_SPRITE}" style="transform: rotate(90deg);">`; }
    else { cell.innerHTML = `<img src="${SPRITES[type]}">`; }
}

function handleStart(r, c, e) {
    if (isAnimating || isGameOver) return;
    if (e.type === 'touchstart') { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; } else { touchStartX = e.clientX; touchStartY = e.clientY; }
    touchStartRow = r; touchStartCol = c;
    const cell = document.getElementById('board').children[r * COLS + c];
    cell.style.transform = 'scale(1.1)'; cell.style.boxShadow = '0 0 15px white';
}

function handleEnd(r, c, e) {
    if (isAnimating || isGameOver || touchStartRow === null) return;
    const startCell = document.getElementById('board').children[touchStartRow * COLS + touchStartCol];
    startCell.style.transform = 'scale(1)'; startCell.style.boxShadow = 'none';
    let endX, endY;
    if (e.type === 'touchend') { endX = e.changedTouches[0].clientX; endY = e.changedTouches[0].clientY; } else { endX = e.clientX; endY = e.clientY; }
    const diffX = endX - touchStartX; const diffY = endY - touchStartY;
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) { touchStartRow = null; return; }
    let targetRow = touchStartRow, targetCol = touchStartCol;
    if (Math.abs(diffX) > Math.abs(diffY)) targetCol += diffX > 0 ? 1 : -1; else targetRow += diffY > 0 ? 1 : -1;
    if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) swapCells(touchStartRow, touchStartCol, targetRow, targetCol);
    touchStartRow = null;
}

function swapCells(r1, c1, r2, c2) {
    isAnimating = true;
    const temp = board[r1][c1]; board[r1][c1] = board[r2][c2]; board[r2][c2] = temp;
    updateCell(document.getElementById('board').children[r1 * COLS + c1], board[r1][c1]);
    updateCell(document.getElementById('board').children[r2 * COLS + c2], board[r2][c2]);
    setTimeout(() => {
        let t1 = board[r1][c1];
        let t2 = board[r2][c2];
        let isSpecial1 = (t1 === 'bomb' || t1 === 'rainbow' || (typeof t1 === 'string' && t1.includes('rocket')));
        let isSpecial2 = (t2 === 'bomb' || t2 === 'rainbow' || (typeof t2 === 'string' && t2.includes('rocket')));

        if (isSpecial1 || isSpecial2) {
            handleSpecialMove(r1, c1, r2, c2); 
        } else {
            let initialMatches = findMatches();
            if (initialMatches.size > 0) {
                if (currentMode === 'classic') {
                    movesLeft--; document.getElementById('goal-display').innerText = `Ходы: ${movesLeft}`;
                    if (movesLeft <= 0) { processMatches(initialMatches, true); setTimeout(() => endGame("Ходы закончились!"), 1000); return; }
                }
                processMatches(initialMatches, true);
            } else {
                const temp = board[r1][c1]; board[r1][c1] = board[r2][c2]; board[r2][c2] = temp;
                updateCell(document.getElementById('board').children[r1 * COLS + c1], board[r1][c1]);
                updateCell(document.getElementById('board').children[r2 * COLS + c2], board[r2][c2]);
                isAnimating = false;
            }
        }
    }, 150);
}

function handleSpecialMove(r1, c1, r2, c2) {
    let t1 = board[r1][c1], t2 = board[r2][c2];
    let cellsDestroyed = [];
    
    if (typeof t1 === 'string' && t1.includes('rocket') && typeof t2 === 'string' && t2.includes('rocket')) {
        if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
        tg.showAlert("🚀 КРЕСТ!");
        let sr = r1, sc = c1;
        board[r1][c1] = null; board[r2][c2] = null;
        for (let c = 0; c < COLS; c++) { cellsDestroyed.push({r: sr, c: c, type: board[sr][c]}); }
        for (let r = 0; r < ROWS; r++) { cellsDestroyed.push({r: r, c: sc, type: board[r][sc]}); }
        
        let unique = new Set();
        cellsDestroyed.forEach(cell => {
            let key = `${cell.r},${cell.c}`;
            if (!unique.has(key)) {
                unique.add(key);
                board[cell.r][cell.c] = null;
                const el = document.getElementById('board').children[cell.r * COLS + cell.c];
                el.classList.add('disappear'); 
            }
        });
        setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(true); }, 200);
    }
    else if (t1 === 'bomb' && t2 === 'bomb') {
        if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
        tg.showAlert("💥 ДВОЙНОЙ ВЗРЫВ!");
        
        let unique = new Set();
        let addToDestroy = (centerR, centerC) => {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = centerR + i, nc = centerC + j;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        let key = `${nr},${nc}`;
                        if (!unique.has(key)) {
                            unique.add(key);
                            cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]});
                        }
                    }
                }
            }
        };
        
        addToDestroy(r1, c1);
        addToDestroy(r2, c2);
        board[r1][c1] = null; board[r2][c2] = null;
        
        cellsDestroyed.forEach(cell => {
            board[cell.r][cell.c] = null;
            const el = document.getElementById('board').children[cell.r * COLS + cell.c];
            el.classList.add('disappear'); 
        });
        setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(true); }, 200);
    }
    else {
        let specialType = null, sr = 0, sc = 0, targetType = null;
        if (typeof t1 === 'string' && (t1.includes('rocket') || t1 === 'bomb' || t1 === 'rainbow')) { specialType = t1; sr = r1; sc = c1; targetType = t2; } 
        else { specialType = t2; sr = r2; sc = c2; targetType = t1; }
        
        if (typeof specialType === 'string' && specialType.includes('rocket')) {
            if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
            board[sr][sc] = null;
            if (specialType === 'rocket_h') {
                for (let c = 0; c < COLS; c++) cellsDestroyed.push({r: sr, c: c, type: board[sr][c]});
            } else {
                for (let r = 0; r < ROWS; r++) cellsDestroyed.push({r: r, c: sc, type: board[r][sc]});
            }
            cellsDestroyed.forEach(cell => {
                board[cell.r][cell.c] = null;
                const el = document.getElementById('board').children[cell.r * COLS + cell.c];
                el.classList.add('disappear'); 
            });
            setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(true); }, 200);
        } else if (specialType === 'bomb') {
            if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
            board[sr][sc] = null; 
            for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
                let nr = sr + i, nc = sc + j;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    cellsDestroyed.push({r: nr, c: nc, type: board[nr][nc]}); 
                    board[nr][nc] = null;
                    const cell = document.getElementById('board').children[nr * COLS + nc];
                    cell.classList.add('disappear'); 
                }
            }
            setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(true); }, 200);
        } else if (specialType === 'rainbow') {
            if(soundPop) { soundPop.currentTime = 0; soundPop.play().catch(e => {}); }
            board[sr][sc] = null;
            for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
                if (board[r][c] === targetType) {
                    cellsDestroyed.push({r, c, type: board[r][c]}); 
                    board[r][c] = null;
                    const cell = document.getElementById('board').children[r * COLS + c];
                    cell.classList.add('disappear'); 
                }
            }
            setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(true); }, 200);
        }
    }
    
    if (goalType === 'fruit') { cellsDestroyed.forEach(cd => { if (cd.type === goalFruitIndex) goalProgress++; }); updateGoalUI(); checkGoalComplete(); }
    score += cellsDestroyed.length * 10; updateScoreUI(); 
}

function explodeBombs(wasPlayerMove) { 
    let queue = [];
    let unique = new Set();

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'bomb') { 
                queue.push({r, c, type: board[r][c]}); 
            }
        }
    }

    if (queue.length > 0) {
        if(soundBoom) { soundBoom.currentTime = 0; soundBoom.play().catch(e => {}); }
        
        while (queue.length > 0) {
            let b = queue.shift();
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = b.r + i, nc = b.c + j;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        let key = `${nr},${nc}`;
                        if (!unique.has(key)) {
                            unique.add(key);
                            if (board[nr][nc] === 'bomb') {
                                queue.push({r: nr, c: nc, type: 'bomb'});
                            }
                            board[nr][nc] = null;
                            const cell = document.getElementById('board').children[nr * COLS + nc];
                            cell.classList.add('disappear'); 
                        }
                    }
                }
            }
        }
        
        score += 100; 
        updateScoreUI(); 
        setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(wasPlayerMove); }, 200); 
    } else { 
        checkMatchesAfterDrop(wasPlayerMove); 
    }
}

function findMatches() {
    let matched = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 2; c++) {
        if (board[r][c] !== null && typeof board[r][c] === 'number' && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
            matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`);
        }
    }
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 2; r++) {
        if (board[r][c] !== null && typeof board[r][c] === 'number' && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
            matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`);
        }
    }
    return matched;
}

function processMatches(matched, isPlayerMove) {
    if(soundPop) { soundPop.currentTime = 0; soundPop.play().catch(e => {}); }
    if (!isPlayerMove) { comboCount++; if (comboCount > 1) { score += 50 * comboCount; } } else { comboCount = 0; }
    
    if (goalType === 'fruit') {
        matched.forEach(pos => { 
            const [r, c] = pos.split(',').map(Number); 
            if (board[r][c] === goalFruitIndex) goalProgress++; 
        });
        updateGoalUI(); 
    }

    let lines = [];
    for (let r = 0; r < ROWS; r++) {
        let count = 1;
        for (let c = 1; c <= COLS; c++) {
            if (c < COLS && board[r][c] !== null && typeof board[r][c] === 'number' && board[r][c] === board[r][c-1]) count++;
            else { if (count >= 3) { let line = []; for(let i=0; i<count; i++) line.push({r, c: c-1-i}); lines.push({cells: line, type: board[r][c-1], count, dir: 'h'}); } count = 1; }
        }
    }
    for (let c = 0; c < COLS; c++) {
        let count = 1;
        for (let r = 1; r <= ROWS; r++) {
            if (r < ROWS && board[r][c] !== null && typeof board[r][c] === 'number' && board[r][c] === board[r-1][c]) count++;
            else { if (count >= 3) { let line = []; for(let i=0; i<count; i++) line.push({r: r-1-i, c}); lines.push({cells: line, type: board[r-1][c], count, dir: 'v'}); } count = 1; }
        }
    }
    
    let spawns = [];
    
    for (let i = 0; i < lines.length; i++) for (let j = 0; j < lines.length; j++) {
        if (i !== j && lines[i].type === lines[j].type) {
            let intersection = lines[i].cells.find(c1 => lines[j].cells.some(c2 => c1.r === c2.r && c1.c === c2.c));
            if (intersection) { spawns.push({r: intersection.r, c: intersection.c, type: 'bomb'}); lines[i].processed = true; lines[j].processed = true; }
        }
    }
    
    lines.forEach(line => {
        if (line.processed) return;
        if (line.count === 4) { 
            let mid = line.cells[1]; 
            spawns.push({r: mid.r, c: mid.c, type: line.dir === 'h' ? 'rocket_h' : 'rocket_v'}); 
        } 
        else if (line.count >= 5) { let mid = line.cells[2]; spawns.push({r: mid.r, c: mid.c, type: 'rainbow'}); }
    });
    
    matched.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        if (!spawns.find(s => s.r === r && s.c === c)) {
            board[r][c] = null;
            const cell = document.getElementById('board').children[r * COLS + c];
            cell.classList.add('disappear'); 
        }
    });
    
    spawns.forEach(s => { board[s.r][s.c] = s.type; updateCell(document.getElementById('board').children[s.r * COLS + s.c], s.type); });
    
    checkGoalComplete();

    let points = matched.size * 10; score += points; updateScoreUI(); if (goalType === 'score') updateGoalUI();
    
    setTimeout(() => { document.querySelectorAll('.disappear').forEach(el => el.classList.remove('disappear')); dropCells(isPlayerMove); }, 200); 
}

function dropCells(wasPlayerMove) {
    for (let c = 0; c < COLS; c++) {
        let newCol = [];
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][c] !== null) { newCol.push(board[r][c]); }
        }
        while (newCol.length < ROWS) { newCol.push(Math.floor(Math.random() * TYPES)); }
        for (let r = 0; r < ROWS; r++) { board[ROWS - 1 - r][c] = newCol[r]; }
    }
    
    for (let r = 0; r < ROWS; r++) { 
        for (let c = 0; c < COLS; c++) { 
            updateCell(document.getElementById('board').children[r * COLS + c], board[r][c]); 
        } 
    }
    
    setTimeout(() => { checkMatchesAfterDrop(wasPlayerMove); }, 150);
}

function checkMatchesAfterDrop(wasPlayerMove) {
    let newMatches = findMatches();
    if (newMatches.size > 0) { processMatches(newMatches, false); } 
    else {
        isAnimating = false;
        if (wasPlayerMove && currentMode === 'classic' && movesLeft <= 0) { if (!checkGoalComplete()) endGame("Ходы закончились!"); }
    }
}

loadPlayerData();
