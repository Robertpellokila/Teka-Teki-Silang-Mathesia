let currentPuzzle = null;
let correctAnswers = 0;
let timeLeft = 240;
let timerInterval = null;
let answeredClues = new Set();

window.onload = function() {
    startGame();
};

async function startGame() {
    const response = await fetch('/get_puzzle');
    currentPuzzle = await response.json();
    
    renderCrossword();
    renderClues();
    startTimer();
}

function renderCrossword() {
    const answers = currentPuzzle.answers;
    const crossword = document.getElementById('crossword');
    crossword.innerHTML = '';
    
    let maxRow = 0;
    let maxCol = 0;
    
    Object.entries(answers).forEach(([clueNum, data]) => {
        const {word, start, direction} = data;
        const [row, col] = start;
        
        if (direction === 'across') {
            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, col + word.length - 1);
        } else {
            maxRow = Math.max(maxRow, row + word.length - 1);
            maxCol = Math.max(maxCol, col);
        }
    });
    
    const rows = maxRow + 1;
    const cols = maxCol + 1;
    
    crossword.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    const cellMap = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    Object.entries(answers).forEach(([clueNum, data]) => {
        const {word, start, direction} = data;
        const [row, col] = start;
        
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'down' ? row + i : row;
            const c = direction === 'across' ? col + i : col;
            
            if (r < rows && c < cols) {
                if (!cellMap[r][c]) {
                    cellMap[r][c] = {
                        letter: word[i],
                        clues: []
                    };
                }
                
                if (i === 0) {
                    cellMap[r][c].clueNum = clueNum;
                }
            }
        }
    });
    
    cellMap.forEach((row, i) => {
        row.forEach((cell, j) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.id = `cell-${i}-${j}`;
            
            if (cell) {
                cellDiv.classList.add('white');
                cellDiv.dataset.letter = cell.letter;
                
                if (cell.clueNum) {
                    const numSpan = document.createElement('span');
                    numSpan.className = 'cell-number';
                    numSpan.textContent = cell.clueNum;
                    cellDiv.appendChild(numSpan);
                }
            } else {
                cellDiv.classList.add('black');
            }
            
            crossword.appendChild(cellDiv);
        });
    });
}

function renderClues() {
    const acrossDiv = document.getElementById('clues-across');
    const downDiv = document.getElementById('clues-down');
    
    acrossDiv.innerHTML = '';
    downDiv.innerHTML = '';
    
    if (currentPuzzle.clues.mendatar) {
        Object.entries(currentPuzzle.clues.mendatar).forEach(([num, clue]) => {
            const clueDiv = createClueElement(num, clue, 'across');
            acrossDiv.appendChild(clueDiv);
        });
    }
    
    if (currentPuzzle.clues.menurun) {
        Object.entries(currentPuzzle.clues.menurun).forEach(([num, clue]) => {
            const clueDiv = createClueElement(num, clue, 'down');
            downDiv.appendChild(clueDiv);
        });
    }
}

function createClueElement(num, clue, direction) {
    const answerLength = currentPuzzle.answers[num]?.length || 0;
    const div = document.createElement('div');
    div.className = 'clue-item';
    div.id = `clue-${num}`;
    div.innerHTML = `
        <strong>${num}.</strong> <span style="color: #666; font-size: 0.85em;">(${currentPuzzle.answers[num]?.word.length || 0} huruf)</span>
        <p>${clue}</p>
        <div class="answer-input">
            <input type="text" id="input-${num}" placeholder="Ketik jawaban..." maxlength="${currentPuzzle.answers[num]?.word.length || 20}">
            <button onclick="checkAnswer('${num}', '${direction}')">Cek</button>
        </div>
    `;
    return div;
}

async function checkAnswer(clueNum, direction) {
    if (answeredClues.has(clueNum)) return;
    
    const input = document.getElementById(`input-${clueNum}`);
    const answer = input.value.trim().toUpperCase();
    
    if (!answer) {
        input.style.background = '#FFE5E5';
        setTimeout(() => {
            input.style.background = 'white';
        }, 500);
        return;
    }
    
    const response = await fetch('/check_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({clue_num: clueNum, answer: answer})
    });
    
    const result = await response.json();
    const answerData = currentPuzzle.answers[clueNum];
    
    if (result.correct) {
        answeredClues.add(clueNum);
        correctAnswers++;
        document.getElementById('score').textContent = correctAnswers;
        
        // Disable input
        input.disabled = true;
        input.value = answerData.word;
        input.style.background = '#90EE90';
        input.style.color = 'rgb(47, 106, 98)';
        input.style.fontWeight = 'bold';
        document.querySelector(`#clue-${clueNum} button`).disabled = true;
        document.getElementById(`clue-${clueNum}`).classList.add('answered');
        
        revealAnswer(answerData);
        
        if (correctAnswers === 6) {
            endGame();
        }
    } else {
        input.style.background = '#FFB6C6';
        input.style.border = '2px solid #ff4444';
        setTimeout(() => {
            input.style.background = 'white';
            input.style.border = '2px solid rgb(47, 106, 98)';
        }, 1000);
    }
}

function revealAnswer(answerData) {
    const {word, start, direction} = answerData;
    const [row, col] = start;
    
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'down' ? row + i : row;
        const c = direction === 'across' ? col + i : col;
        const cell = document.getElementById(`cell-${r}-${c}`);
        
        if (cell && !cell.classList.contains('black')) {
            cell.classList.add('revealed');
            
            const existingNumber = cell.querySelector('.cell-number');
            cell.textContent = '';
            
            if (existingNumber) {
                cell.appendChild(existingNumber);
            }
            
            const letterSpan = document.createElement('span');
            letterSpan.className = 'cell-letter';
            letterSpan.textContent = word[i];
            cell.appendChild(letterSpan);
        }
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const code = document.getElementById('access-code');
    
    let accessCode = '';
    
    if (correctAnswers < 3) {
        title.textContent = '📝 Game Over';
        accessCode = 'BD1099';
        message.textContent = `Anda menjawab ${correctAnswers} dari 6 soal dengan benar.`;
    } else if (correctAnswers <= 4) {
        title.textContent = '✨ Congratulation!';
        accessCode = 'BD2072';
        message.textContent = `Bagus! Anda menjawab ${correctAnswers} dari 6 soal dengan benar.`;
    } else {
        title.textContent = '🏆 Bravo!';
        accessCode = 'BD3080';
        message.textContent = `Luar biasa! Anda menjawab ${correctAnswers} dari 6 soal dengan benar!`;
    }
    
    code.textContent = accessCode;
    modal.classList.add('active');
}