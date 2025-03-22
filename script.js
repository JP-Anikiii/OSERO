const board = document.getElementById('board');
const message = document.getElementById('message');
const resetButton = document.getElementById('resetButton');
const soundToggleButton = document.getElementById('soundToggleButton');
const playerSelector = document.getElementById('playerSelector');
let gameBoard = Array(8).fill().map(() => Array(8).fill(null));
let currentPlayer = 'black';
let playerColor = 'black';
let difficulty = 'beginner';
let soundEnabled = true;
let gameEnded = false;
let gameStarted = false;

// AudioContextの初期化
const audioContext = new AudioContext();

// 電子音を再生する関数
function playBeep(frequency, duration) {
    if (!soundEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gainNode.gain.value = 0.1;
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// レベル選択UI
function addDifficultySelector() {
    const selector = document.createElement('select');
    const levels = [
        { value: 'beginner', text: '初心者' },
        { value: 'intermediate', text: '中級者' },
        { value: 'advanced', text: '上級者' }
    ];
    levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.value;
        option.textContent = level.text;
        if (level.value === 'beginner') option.selected = true;
        selector.appendChild(option);
    });
    selector.addEventListener('change', (e) => {
        difficulty = e.target.value;
        message.textContent = `${levels.find(l => l.value === difficulty).text}に設定しました。${playerColor === 'black' ? '黒' : '白'}を選択`;
    });
    document.body.insertBefore(selector, board);
}

// プレイヤー選択の処理
playerSelector.addEventListener('change', (e) => {
    playerColor = e.target.value;
    initializeBoard();
});

// 音声ON/OFF切り替え
soundToggleButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleButton.textContent = soundEnabled ? '音声ON' : '音声OFF';
    if (soundEnabled && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// 初回クリック/タッチでAudioContextを有効化
document.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });
document.addEventListener('touchstart', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// 初期配置
function initializeBoard() {
    gameBoard = Array(8).fill().map(() => Array(8).fill(null));
    gameBoard[3][3] = 'white';
    gameBoard[3][4] = 'black';
    gameBoard[4][3] = 'black';
    gameBoard[4][4] = 'white';
    currentPlayer = 'black';
    gameEnded = false;
    gameStarted = false;
    renderBoard();
    message.textContent = playerColor === 'black' ? '黒のターン' : '白を選択しました。ボードをクリックして開始';
    console.log('初期化: playerColor=', playerColor, 'currentPlayer=', currentPlayer);
}

// ボードを描画
function renderBoard() {
    board.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (gameBoard[i][j]) {
                cell.classList.add(gameBoard[i][j]);
            }
            if (!gameEnded) {
                cell.addEventListener('click', () => handleClick(i, j));
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    handleClick(i, j);
                });
            }
            board.appendChild(cell);
        }
    }
    checkGameEnd();
}

// 石を置く処理
function handleClick(row, col) {
    if (gameEnded) return;

    // 白を選択し、ゲーム未開始の場合
    if (playerColor === 'white' && !gameStarted) {
        gameStarted = true;
        currentPlayer = 'black';
        message.textContent = '黒のターン';
        setTimeout(aiMove, 1000); // 黒(AI)が初手を打つ
        console.log('白選択: AI初手開始');
        return;
    }

    // プレイヤーのターンでのみ操作可能
    if (currentPlayer === playerColor && isValidMove(row, col, currentPlayer)) {
        gameStarted = true;
        placeStone(row, col, currentPlayer);
        flipStones(row, col, currentPlayer);
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        renderBoard();
        if (!gameEnded) {
            message.textContent = `${currentPlayer === 'black' ? '黒' : '白'}のターン`;
            if (currentPlayer !== playerColor) {
                setTimeout(aiMove, 1000);
            }
        }
        console.log('プレイヤー手: row=', row, 'col=', col, 'currentPlayer=', currentPlayer);
    }
}

// 有効な手かチェック
function isValidMove(row, col, player) {
    if (gameBoard[row][col]) return false;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let [dr, dc] of directions) {
        if (checkDirection(row, col, dr, dc, player)) return true;
    }
    return false;
}

// 方向をチェック
function checkDirection(row, col, dr, dc, player) {
    let r = row + dr;
    let c = col + dc;
    let opponent = player === 'black' ? 'white' : 'black';
    let hasOpponent = false;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && gameBoard[r][c] === opponent) {
        hasOpponent = true;
        r += dr;
        c += dc;
    }
    return hasOpponent && r >= 0 && r < 8 && c >= 0 && c < 8 && gameBoard[r][c] === player;
}

// 石を置く
function placeStone(row, col, player) {
    gameBoard[row][col] = player;
    playBeep(800, 0.1);
}

// 石をひっくり返す
function flipStones(row, col, player) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    let flipped = false;
    for (let [dr, dc] of directions) {
        if (checkDirection(row, col, dr, dc, player)) {
            let r = row + dr;
            let c = col + dc;
            let opponent = player === 'black' ? 'white' : 'black';
            while (gameBoard[r][c] === opponent) {
                gameBoard[r][c] = player;
                flipped = true;
                r += dr;
                c += dc;
            }
        }
    }
    if (flipped) playBeep(400, 0.2);
}

// ひっくり返せる石の数を計算
function countFlips(row, col, player) {
    let count = 0;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let [dr, dc] of directions) {
        if (checkDirection(row, col, dr, dc, player)) {
            let r = row + dr;
            let c = col + dc;
            let opponent = player === 'black' ? 'white' : 'black';
            while (gameBoard[r][c] === opponent) {
                count++;
                r += dr;
                c += dc;
            }
        }
    }
    return count;
}

// AIの手を決定
function aiMove() {
    if (gameEnded || currentPlayer === playerColor) return;
    let validMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, currentPlayer)) {
                validMoves.push([i, j, countFlips(i, j, currentPlayer)]);
            }
        }
    }

    if (validMoves.length === 0) {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        renderBoard();
        return;
    }

    let move;
    switch (difficulty) {
        case 'beginner':
            validMoves.sort((a, b) => a[2] - b[2]);
            move = validMoves[Math.floor(Math.random() * Math.min(3, validMoves.length))];
            break;
        case 'intermediate':
            move = validMoves.reduce((max, curr) => curr[2] > max[2] ? curr : max);
            break;
        case 'advanced':
            move = minimaxMove(validMoves, 4, currentPlayer, -Infinity, Infinity);
            break;
    }

    const [row, col] = move;
    placeStone(row, col, currentPlayer);
    flipStones(row, col, currentPlayer);
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    renderBoard();
    if (!gameEnded) message.textContent = `${currentPlayer === 'black' ? '黒' : '白'}のターン`;
    console.log('AI手: row=', row, 'col=', col, 'currentPlayer=', currentPlayer);
}

// ミニマックス（アルファ・ベータ枝刈り付き）
function minimaxMove(validMoves, depth, player, alpha, beta) {
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    for (let [row, col] of validMoves) {
        let tempBoard = gameBoard.map(row => [...row]);
        placeStone(row, col, player);
        flipStones(row, col, player);
        let score = minimax(depth - 1, player === 'white' ? 'black' : 'white', alpha, beta);
        if (score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
        }
        gameBoard = tempBoard.map(row => [...row]);
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
    }
    return bestMove;
}

function minimax(depth, player, alpha, beta) {
    if (depth === 0) return evaluateBoard(player);
    let validMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, player)) validMoves.push([i, j]);
        }
    }
    if (validMoves.length === 0) return evaluateBoard(player);

    if (player === 'white') {
        let maxScore = -Infinity;
        for (let [row, col] of validMoves) {
            let tempBoard = gameBoard.map(row => [...row]);
            placeStone(row, col, player);
            flipStones(row, col, player);
            let score = minimax(depth - 1, 'black', alpha, beta);
            maxScore = Math.max(maxScore, score);
            gameBoard = tempBoard.map(row => [...row]);
            alpha = Math.max(alpha, maxScore);
            if (beta <= alpha) break;
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let [row, col] of validMoves) {
            let tempBoard = gameBoard.map(row => [...row]);
            placeStone(row, col, player);
            flipStones(row, col, player);
            let score = minimax(depth - 1, 'white', alpha, beta);
            minScore = Math.min(minScore, score);
            gameBoard = tempBoard.map(row => [...row]);
            beta = Math.min(beta, minScore);
            if (beta <= alpha) break;
        }
        return minScore;
    }
}

// 評価関数
function evaluateBoard(player) {
    let whiteCount = 0, blackCount = 0;
    let whiteCorners = 0, blackCorners = 0;
    let whiteStable = 0, blackStable = 0;
    let whiteMobility = 0, blackMobility = 0;

    const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (gameBoard[i][j] === 'white') whiteCount++;
            if (gameBoard[i][j] === 'black') blackCount++;
            if (corners.some(([r, c]) => r === i && c === j)) {
                if (gameBoard[i][j] === 'white') whiteCorners++;
                if (gameBoard[i][j] === 'black') blackCorners++;
            }
            if (gameBoard[i][j] && isStable(i, j)) {
                if (gameBoard[i][j] === 'white') whiteStable++;
                if (gameBoard[i][j] === 'black') blackStable++;
            }
        }
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, 'white')) whiteMobility++;
            if (isValidMove(i, j, 'black')) blackMobility++;
        }
    }

    const cornerWeight = 50;
    const stableWeight = 10;
    const mobilityWeight = 5;
    const stoneWeight = 1;
    let score =
        (whiteCount - blackCount) * stoneWeight +
        (whiteCorners - blackCorners) * cornerWeight +
        (whiteStable - blackStable) * stableWeight +
        (whiteMobility - blackMobility) * mobilityWeight;

    return player === 'white' ? score : -score;
}

// 安定石の判定
function isStable(row, col) {
    const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
    if (corners.some(([r, c]) => r === row && c === col)) return true;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    return directions.every(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        return r < 0 || r >= 8 || c < 0 || c >= 8 || gameBoard[r][c] !== null;
    });
}

// ゲーム終了チェックとスコア表示
function checkGameEnd() {
    if (gameEnded) return;
    let blackMoves = false, whiteMoves = false;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, 'black')) blackMoves = true;
            if (isValidMove(i, j, 'white')) whiteMoves = true;
        }
    }

    if (!blackMoves && !whiteMoves) {
        let blackCount = 0, whiteCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (gameBoard[i][j] === 'black') blackCount++;
                if (gameBoard[i][j] === 'white') whiteCount++;
            }
        }
        let result = blackCount > whiteCount ? '黒の勝ち' : whiteCount > blackCount ? '白の勝ち' : '引き分け';
        message.textContent = `ゲーム終了！ 黒: ${blackCount} 白: ${whiteCount} - ${result}`;
        gameEnded = true;
        console.log('ゲーム終了: blackCount=', blackCount, 'whiteCount=', whiteCount, 'result=', result);
    } else if (!blackMoves && currentPlayer === 'black') {
        currentPlayer = 'white';
        message.textContent = '黒がパス。白のターン';
        if (currentPlayer !== playerColor) setTimeout(aiMove, 1000);
    } else if (!whiteMoves && currentPlayer === 'white') {
        currentPlayer = 'black';
        message.textContent = '白がパス。黒のターン';
        if (currentPlayer !== playerColor) setTimeout(aiMove, 1000);
    }
}

// リセット機能
resetButton.addEventListener('click', () => {
    initializeBoard();
});

// ゲーム開始
addDifficultySelector();
initializeBoard();