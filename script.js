const board = document.getElementById('board');
const message = document.getElementById('message');
const resetButton = document.getElementById('resetButton');
const soundToggleButton = document.getElementById('soundToggleButton');
let gameBoard = Array(8).fill().map(() => Array(8).fill(null));
let currentPlayer = 'black';
let difficulty = 1;
let soundEnabled = true;
let gameEnded = false; // ゲーム終了フラグを追加

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

// 難易度選択UI
function addDifficultySelector() {
    const selector = document.createElement('select');
    for (let i = 1; i <= 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `難易度 ${i}`;
        if (i === 1) option.selected = true;
        selector.appendChild(option);
    }
    selector.addEventListener('change', (e) => {
        difficulty = parseInt(e.target.value);
        message.textContent = `難易度${difficulty}に設定しました。黒のターン`;
    });
    document.body.insertBefore(selector, board);
}

// 音声ON/OFF切り替え
soundToggleButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleButton.textContent = soundEnabled ? '音声ON' : '音声OFF';
    if (soundEnabled && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// 初回クリックでAudioContextを有効化
document.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
        console.log('AudioContextが有効化されました');
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
    gameEnded = false; // リセット時にゲーム終了フラグを解除
    renderBoard();
    message.textContent = '黒のターン';
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
            if (!gameEnded) { // ゲーム終了後はクリック無効
                cell.addEventListener('click', () => handleClick(i, j));
            }
            board.appendChild(cell);
        }
    }
    checkGameEnd();
}

// 石を置く処理
function handleClick(row, col) {
    if (gameEnded) return; // ゲーム終了後は操作無効
    if (isValidMove(row, col, currentPlayer)) {
        placeStone(row, col, currentPlayer);
        flipStones(row, col, currentPlayer);
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        renderBoard();
        if (!gameEnded) {
            message.textContent = `${currentPlayer === 'black' ? '黒' : '白'}のターン`;
            if (currentPlayer === 'white') {
                setTimeout(aiMove, 1000);
            }
        }
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
    if (gameEnded) return; // ゲーム終了後はAIも動作しない
    let validMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, 'white')) {
                validMoves.push([i, j, countFlips(i, j, 'white')]);
            }
        }
    }

    if (validMoves.length === 0) {
        currentPlayer = 'black';
        renderBoard();
        return;
    }

    let move;
    switch (difficulty) {
        case 1:
            validMoves.sort((a, b) => a[2] - b[2]);
            move = validMoves[Math.floor(Math.random() * Math.min(3, validMoves.length))];
            break;
        case 2:
            move = validMoves[Math.floor(Math.random() * validMoves.length)];
            break;
        case 3:
            move = validMoves.reduce((max, curr) => curr[2] > max[2] ? curr : max);
            break;
        case 4:
            move = minimaxMove(validMoves, 1, 'white');
            break;
        case 5:
            move = minimaxMove(validMoves, 2, 'white');
            break;
    }

    const [row, col] = move;
    placeStone(row, col, 'white');
    flipStones(row, col, 'white');
    currentPlayer = 'black';
    renderBoard();
    if (!gameEnded) message.textContent = '黒のターン';
}

// ミニマックス
function minimaxMove(validMoves, depth, player) {
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    for (let [row, col] of validMoves) {
        let tempBoard = gameBoard.map(row => [...row]);
        placeStone(row, col, player);
        flipStones(row, col, player);
        let score = evaluateBoard(depth - 1, player === 'white' ? 'black' : 'white');
        if (score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
        }
        gameBoard = tempBoard.map(row => [...row]);
    }
    return bestMove;
}

// ボードの評価
function evaluateBoard(depth, player) {
    if (depth === 0) {
        let whiteCount = 0, blackCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (gameBoard[i][j] === 'white') whiteCount++;
                if (gameBoard[i][j] === 'black') blackCount++;
            }
        }
        return player === 'white' ? whiteCount - blackCount : blackCount - whiteCount;
    }
    let validMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(i, j, player)) validMoves.push([i, j]);
        }
    }
    if (validMoves.length === 0) return evaluateBoard(0, player);
    let score = -Infinity;
    for (let [row, col] of validMoves) {
        let tempBoard = gameBoard.map(row => [...row]);
        placeStone(row, col, player);
        flipStones(row, col, player);
        score = Math.max(score, -evaluateBoard(depth - 1, player === 'white' ? 'black' : 'white'));
        gameBoard = tempBoard.map(row => [...row]);
    }
    return score;
}

// ゲーム終了チェックとスコア表示
function checkGameEnd() {
    if (gameEnded) return; // 既に終了している場合は処理しない
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
        gameEnded = true; // ゲーム終了フラグを立てる
        console.log('ゲーム終了:', { blackCount, whiteCount, result });
    } else if (!blackMoves && currentPlayer === 'black') {
        currentPlayer = 'white';
        message.textContent = '黒がパス。白のターン';
        setTimeout(aiMove, 1000);
    } else if (!whiteMoves && currentPlayer === 'white') {
        currentPlayer = 'black';
        message.textContent = '白がパス。黒のターン';
    }
}

// リセット機能
resetButton.addEventListener('click', () => {
    initializeBoard();
});

// ゲーム開始
addDifficultySelector();
initializeBoard();