const rows = 50;
const cols = 50;
let grid = [];
let isDrawing = false;
let isErasing = false;
let intervalId;
let speed = 100; // Default speed in ms
let aliveCellColor = '#f39c12'; // Default alive cell color
let stepCount = 0; // Step counter to track generations
let aliveCellImage = null; // To store the image data

let randomColorsMode = false;

const gridElement = document.getElementById("grid");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const cellColorPicker = document.getElementById("cellColorPicker");
const stepCounterElement = document.getElementById("stepCounter");
const form = document.querySelector('form');
const loadPatternSelect = document.getElementById('loadPatternSelect');
const randomColorsToggle = document.getElementById('randomColorsToggle');

// --- CELL STRUCTURE MODIFICATION ---
// Each cell is now an object: { state: 0|1, color: {r,g,b}|undefined }

function createGrid() {
    grid = [];
    gridElement.innerHTML = '';
    for (let row = 0; row < rows; row++) {
        const rowArray = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            // Mouse events for drawing and dragging
            cell.addEventListener('mousedown', () => startDrawing(row, col));
            cell.addEventListener('mouseover', () => dragDrawing(row, col));
            cell.addEventListener('mouseup', stopDrawing);

            gridElement.appendChild(cell);
            rowArray.push({ state: 0, color: undefined });
        }
        grid.push(rowArray);
    }

    // Add event listeners to handle drawing when mouse is released
    document.addEventListener('mouseup', stopDrawing);
}

function startDrawing(row, col) {
    isDrawing = true;
    isErasing = grid[row][col].state === 1;
    toggleCell(row, col);
}

function dragDrawing(row, col) {
    if (isDrawing) {
        grid[row][col].state = isErasing ? 0 : 1;
        // Assign color if drawing and randomColorsMode is on
        if (!isErasing && randomColorsMode) {
            grid[row][col].color = randomColor();
        }
        updateGrid();
    }
}

function stopDrawing() {
    isDrawing = false;
}

function toggleCell(row, col) {
    if (grid[row][col].state === 1) {
        grid[row][col].state = 0;
        grid[row][col].color = undefined;
    } else {
        grid[row][col].state = 1;
        if (randomColorsMode) {
            grid[row][col].color = randomColor();
        }
    }
    updateGrid();
}

function updateGrid() {
    gridElement.childNodes.forEach((cell, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        if (grid[row][col].state === 1) {
            if (randomColorsMode && grid[row][col].color) {
                const color = grid[row][col].color;
                cell.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
                cell.style.boxShadow = `0 2px 5px rgba(${color.r},${color.g},${color.b},0.5)`;
                cell.style.backgroundImage = "";
            } else if (aliveCellImage) {
                cell.style.backgroundColor = "";
                cell.style.backgroundImage = `url(${aliveCellImage})`;
                cell.style.backgroundSize = "cover";
                cell.style.backgroundPosition = "center";
                cell.style.boxShadow = `0 2px 5px ${aliveCellColor}88`;
            } else {
                cell.style.backgroundImage = "";
                cell.style.backgroundColor = aliveCellColor;
                cell.style.boxShadow = `0 2px 5px ${aliveCellColor}88`;
            }
        } else {
            cell.style.backgroundColor = '#3e3e3e';
            cell.style.backgroundImage = "";
            cell.style.boxShadow = 'none';
        }
    });
}

const cellPicturePicker = document.getElementById("cellPicturePicker");

cellPicturePicker.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            aliveCellImage = e.target.result;
            updateGrid();
        };
        reader.readAsDataURL(file);
    } else {
        aliveCellImage = null;
        updateGrid();
    }
});

// --- RANDOM COLORS MODE TOGGLE HANDLER ---
randomColorsToggle.addEventListener("change", function() {
    randomColorsMode = randomColorsToggle.checked;
    if (randomColorsMode) {
        assignRandomColorsToAliveCells();
    }
    updateGrid();
});

function assignRandomColorsToAliveCells() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col].state === 1) {
                grid[row][col].color = randomColor();
            }
        }
    }
}

function randomColor() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
}

function getBlendedColor(color1, color2) {
    return {
        r: Math.floor((color1.r + color2.r) / 2),
        g: Math.floor((color1.g + color2.g) / 2),
        b: Math.floor((color1.b + color2.b) / 2)
    };
}

// --- GAME LOGIC ---

function getNextGeneration() {
    // Prepare new grid with same structure
    const nextGrid = grid.map(row => row.map(cell => ({
        state: cell.state,
        color: cell.color ? { ...cell.color } : undefined
    })));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const aliveNeighbors = countAliveNeighbors(row, col);
            if (grid[row][col].state === 1) {
                if (aliveNeighbors < 2 || aliveNeighbors > 3) {
                    nextGrid[row][col].state = 0;
                    nextGrid[row][col].color = undefined;
                }
            } else {
                if (aliveNeighbors === 3) {
                    nextGrid[row][col].state = 1;
                    // Random Colors Mode: blend two random alive neighbors' colors
                    if (randomColorsMode) {
                        const aliveColors = getAliveNeighborsColors(row, col);
                        if (aliveColors.length >= 2) {
                            // Pick two at random
                            let idx1 = Math.floor(Math.random() * aliveColors.length);
                            let idx2;
                            do { idx2 = Math.floor(Math.random() * aliveColors.length); } while (idx2 === idx1);
                            nextGrid[row][col].color = getBlendedColor(aliveColors[idx1], aliveColors[idx2]);
                        } else if (aliveColors.length === 1) {
                            nextGrid[row][col].color = { ...aliveColors[0] };
                        } else {
                            nextGrid[row][col].color = randomColor();
                        }
                    }
                }
            }
        }
    }

    grid = nextGrid;
    updateGrid();
    stepCount++;
    stepCounterElement.textContent = stepCount;
}

function countAliveNeighbors(row, col) {
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    return neighbors.reduce((aliveCount, [dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            aliveCount += grid[newRow][newCol].state;
        }
        return aliveCount;
    }, 0);
}

function getAliveNeighborsColors(row, col) {
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    const colors = [];
    neighbors.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            if (grid[newRow][newCol].state === 1 && grid[newRow][newCol].color) {
                colors.push(grid[newRow][newCol].color);
            }
        }
    });
    return colors;
}

function startGame() {
    if (!intervalId) {
        intervalId = setInterval(getNextGeneration, speed);
    }
}

function stopGame() {
    clearInterval(intervalId);
    intervalId = null;
}

function randomizeGrid() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const alive = Math.random() > 0.7 ? 1 : 0;
            grid[row][col].state = alive;
            if (alive && randomColorsMode) {
                grid[row][col].color = randomColor();
            } else {
                grid[row][col].color = undefined;
            }
        }
    }
    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
}

function clearGrid() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            grid[row][col].state = 0;
            grid[row][col].color = undefined;
        }
    }
    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
}

// --- PATTERN STORAGE (MODIFIED TO STORE color) ---

function savePattern() {
    const patternName = prompt("Enter a name for your pattern:");
    if (patternName) {
        const patterns = JSON.parse(localStorage.getItem('patterns') || '{}');
        // Store state and color for each cell
        patterns[patternName] = grid.map(row => row.map(cell => ({
            state: cell.state,
            color: cell.color
        })));
        localStorage.setItem('patterns', JSON.stringify(patterns));
        updatePatternSelect();
    }
}

function loadPattern() {
    const selectedPattern = loadPatternSelect.value;
    if (selectedPattern) {
        const patterns = JSON.parse(localStorage.getItem('patterns'));
        const pattern = patterns[selectedPattern];
        // Defensive: support both old format (number) and new (object)
        grid = pattern.map(row => row.map(cell => {
            if (typeof cell === "number") {
                return { state: cell, color: undefined };
            } else {
                return { state: cell.state, color: cell.color };
            }
        }));
        updateGrid();
        stepCount = 0;
        stepCounterElement.textContent = stepCount;
    }
}

function deletePattern() {
    const selectedPattern = loadPatternSelect.value;
    if (selectedPattern) {
        const confirmDelete = confirm(`Are you sure you want to delete the pattern "${selectedPattern}"?`);
        if (confirmDelete) {
            const patterns = JSON.parse(localStorage.getItem('patterns'));
            delete patterns[selectedPattern];
            localStorage.setItem('patterns', JSON.stringify(patterns));
            updatePatternSelect();
        }
    } else {
        alert("Please select a pattern to delete.");
    }
}

function updatePatternSelect() {
    const patterns = JSON.parse(localStorage.getItem('patterns') || '{}');
    loadPatternSelect.innerHTML = '<option value="">Select a pattern to load</option>';
    for (const patternName in patterns) {
        const option = document.createElement('option');
        option.value = patternName;
        option.textContent = patternName;
        loadPatternSelect.appendChild(option);
    }
}

// Initialize the grid on page load
createGrid();
updatePatternSelect();

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("stopButton").addEventListener("click", stopGame);
document.getElementById("randomButton").addEventListener("click", randomizeGrid);
document.getElementById("clearButton").addEventListener("click", clearGrid);
document.getElementById("savePatternButton").addEventListener("click", savePattern);
document.getElementById("loadPatternButton").addEventListener("click", loadPattern);
document.getElementById("deletePatternButton").addEventListener("click", deletePattern);

// Change simulation speed
speedRange.addEventListener("input", function() {
    speed = speedRange.value;
    speedValue.textContent = `${speed} ms`;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(getNextGeneration, speed);
    }
});

// Change alive cell color
cellColorPicker.addEventListener("input", function() {
    aliveCellColor = cellColorPicker.value;
    updateGrid();
});

// Reset button resets speed, color, image, and grid
document.getElementById("resetButton").addEventListener("click", function() {
    speedRange.value = 100;
    speed = 100;
    speedValue.textContent = '100 ms';
    aliveCellColor = '#f39c12';
    aliveCellImage = null;
    cellColorPicker.value = aliveCellColor;
    randomColorsMode = false;
    randomColorsToggle.checked = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(getNextGeneration, speed);
    }
    clearGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
});
