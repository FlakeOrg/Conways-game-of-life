let rows = 50;
let cols = 50;
let grid = [];
let isDrawing = false;
let isErasing = false;
let intervalId;
let speed = 100; // Default speed in ms
let aliveCellColor = '#f39c12'; // Default alive cell color
let stepCount = 0; // Step counter
let aliveCellImage = null; // To store the image data
let randomColorsMode = false;
let kanyeLife = false; //kanye time


const gridElement = document.getElementById("grid");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const cellColorPicker = document.getElementById("cellColorPicker");
const stepCounterElement = document.getElementById("stepCounter");
const loadPatternSelect = document.getElementById("loadPatternSelect");
const randomColorsToggle = document.getElementById("randomColorsToggle");

// --- GRID CREATION ---
function createGrid() {
    grid = [];
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${cols}, 18px)`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, 18px)`;

    for (let row = 0; row < rows; row++) {
        const rowArray = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.addEventListener('mousedown', () => startDrawing(row, col));
            cell.addEventListener('mouseover', () => dragDrawing(row, col));
            cell.addEventListener('mouseup', stopDrawing);
            gridElement.appendChild(cell);
            rowArray.push({ state: 0, color: undefined });
        }
        grid.push(rowArray);
    }

    document.addEventListener('mouseup', stopDrawing);
    isSelecting = false;
    isPasteMode = false;
    pasteTarget = null;
    selectionStart = null;
    selectionEnd = null;
}

function startDrawing(row, col) {
    isDrawing = true;
    isErasing = grid[row][col].state === 1;
    toggleCell(row, col);
}

function dragDrawing(row, col) {
    if (isDrawing) {
        grid[row][col].state = isErasing ? 0 : 1;
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

// --- VISUAL UPDATES ---
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
                cell.style.backgroundImage = `url(${aliveCellImage})`;
                cell.style.backgroundSize = "cover";
                cell.style.backgroundPosition = "center";
                cell.style.boxShadow = `0 2px 5px ${aliveCellColor}88`;
            } else {
                cell.style.backgroundColor = aliveCellColor;
                cell.style.boxShadow = `0 2px 5px ${aliveCellColor}88`;
                cell.style.backgroundImage = "";
            }
        } else {
            cell.style.backgroundColor = '#3e3e3e';
            cell.style.backgroundImage = "";
            cell.style.boxShadow = 'none';
        }
    });

    // Selection outline
    if (isSelecting && selectionStart && selectionEnd) {
        const bounds = getSelectionBounds();
        for (let r = bounds.r1; r <= bounds.r2; r++) {
            for (let c = bounds.c1; c <= bounds.c2; c++) {
                const index = r * cols + c;
                const cell = gridElement.childNodes[index];
                if (cell) cell.style.outline = '2px dashed #ffffff55';
            }
        }
    } else {
        gridElement.childNodes.forEach((cell) => (cell.style.outline = 'none'));
    }

    if (kanyeTime) {
        
    }
}

// --- IMAGE PICKER ---
const cellPicturePicker = document.getElementById("cellPicturePicker");
cellPicturePicker.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            aliveCellImage = e.target.result;
            updateGrid();
        };
        reader.readAsDataURL(file);
    } else {
        aliveCellImage = null;
        updateGrid();
    }
});

// --- RANDOM COLOR MODE ---
randomColorsToggle.addEventListener("change", () => {
    randomColorsMode = randomColorsToggle.checked;
    if (randomColorsMode) {
        assignRandomColorsToAliveCells();
    } else {
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                grid[r][c].color = undefined;
    }
    updateGrid();
});

function assignRandomColorsToAliveCells() {
    for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++)
            if (grid[row][col].state === 1)
                grid[row][col].color = randomColor();
}

function randomColor() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };
}

function getBlendedColor(c1, c2) {
    return {
        r: Math.floor((c1.r + c2.r) / 2),
        g: Math.floor((c1.g + c2.g) / 2),
        b: Math.floor((c1.b + c2.b) / 2),
    };
}

// --- GAME LOGIC ---
function getNextGeneration() {
    const nextGrid = grid.map(row => row.map(cell => ({ ...cell })));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const aliveNeighbors = countAliveNeighbors(row, col);
            if (grid[row][col].state === 1) {
                if (aliveNeighbors < 2 || aliveNeighbors > 3) {
                    nextGrid[row][col] = { state: 0, color: undefined };
                }
            } else if (aliveNeighbors === 3) {
                nextGrid[row][col].state = 1;
                if (randomColorsMode) {
                    const colors = getAliveNeighborsColors(row, col);
                    if (colors.length >= 2) {
                        const [c1, c2] = colors.sort(() => 0.5 - Math.random()).slice(0, 2);
                        nextGrid[row][col].color = getBlendedColor(c1, c2);
                    } else nextGrid[row][col].color = colors[0] || randomColor();
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
    return neighbors.reduce((count, [dx, dy]) => {
        const r = (row + dx + rows) % rows;
        const c = (col + dy + cols) % cols;
        return count + grid[r][c].state;
    }, 0);
}

function getAliveNeighborsColors(row, col) {
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];
    const colors = [];
    neighbors.forEach(([dx, dy]) => {
        const r = (row + dx + rows) % rows;
        const c = (col + dy + cols) % cols;
        if (grid[r][c].state === 1 && grid[r][c].color)
            colors.push(grid[r][c].color);
    });
    return colors;
}

// --- SIMULATION CONTROLS ---
function startGame() {
    if (!intervalId) intervalId = setInterval(getNextGeneration, speed);
}
function stopGame() {
    clearInterval(intervalId);
    intervalId = null;
}
function randomizeGrid() {
    for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
            const alive = Math.random() > 0.7 ? 1 : 0;
            grid[row][col].state = alive;
            grid[row][col].color = alive && randomColorsMode ? randomColor() : undefined;
        }
    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
}
function clearGrid() {
    for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
            grid[row][col].state = 0;
            grid[row][col].color = undefined;
        }
    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
}

// --- PATTERN STORAGE ---
function savePattern() {
    const name = prompt("Enter a name for your pattern:");
    if (name) {
        const patterns = JSON.parse(localStorage.getItem("patterns") || "{}");
        patterns[name] = grid.map(r => r.map(c => ({ state: c.state, color: c.color })));
        localStorage.setItem("patterns", JSON.stringify(patterns));
        updatePatternSelect();
    }
}

function loadPattern() {
    const name = loadPatternSelect.value;
    if (!name) return;
    const patterns = JSON.parse(localStorage.getItem("patterns"));
    const pattern = patterns[name];
    grid = pattern.map(row => row.map(cell =>
        typeof cell === "number" ? { state: cell, color: undefined } : cell
    ));

    // Adjust grid size if needed
    if (grid.length !== rows || grid[0].length !== cols) {
        rows = grid.length;
        cols = grid[0].length;
        gridElement.style.gridTemplateColumns = `repeat(${cols}, 18px)`;
        gridElement.style.gridTemplateRows = `repeat(${rows}, 18px)`;
    }

    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
}

function deletePattern() {
    const name = loadPatternSelect.value;
    if (!name) return alert("Please select a pattern to delete.");
    if (confirm(`Delete pattern "${name}"?`)) {
        const patterns = JSON.parse(localStorage.getItem("patterns"));
        delete patterns[name];
        localStorage.setItem("patterns", JSON.stringify(patterns));
        updatePatternSelect();
    }
}

function updatePatternSelect() {
    const patterns = JSON.parse(localStorage.getItem("patterns") || "{}");
    loadPatternSelect.innerHTML = '<option value="">Select a pattern to load</option>';
    for (const key in patterns) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        loadPatternSelect.appendChild(option);
    }
}

// --- INITIALIZE ---
createGrid();
updatePatternSelect();

// --- BUTTONS ---
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("stopButton").addEventListener("click", stopGame);
document.getElementById("randomButton").addEventListener("click", randomizeGrid);
document.getElementById("clearButton").addEventListener("click", clearGrid);
document.getElementById("savePatternButton").addEventListener("click", savePattern);
document.getElementById("loadPatternButton").addEventListener("click", loadPattern);
document.getElementById("deletePatternButton").addEventListener("click", deletePattern);

// --- SETTINGS ---
speedRange.addEventListener("input", () => {
    speed = speedRange.value;
    speedValue.textContent = `${speed} ms`;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(getNextGeneration, speed);
    }
});

cellColorPicker.addEventListener("input", () => {
    aliveCellColor = cellColorPicker.value;
    updateGrid();
});

document.getElementById("resetButton").addEventListener("click", () => {
    speedRange.value = 100;
    speed = 100;
    speedValue.textContent = "100 ms";
    aliveCellColor = "#f39c12";
    aliveCellImage = null;
    cellColorPicker.value = aliveCellColor;
    randomColorsMode = false;
    randomColorsToggle.checked = false;
    clearGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
});

// --- GRID RESIZING ---
const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const resizeGridButton = document.getElementById("resizeGridButton");

resizeGridButton.addEventListener("click", () => {
    const newRows = parseInt(rowsInput.value);
    const newCols = parseInt(colsInput.value);

    if (isNaN(newRows) || isNaN(newCols) || newRows <= 0 || newCols <= 0) {
        alert("Please enter valid positive numbers for rows and columns.");
        return;
    }

    // Stop any running simulation
    stopGame();

    rows = newRows;
    cols = newCols;
    createGrid();
    updateGrid();

    stepCount = 0;
    stepCounterElement.textContent = stepCount;
});



// --- COPY & PASTE SELECTION ---
gridElement.addEventListener("mousedown", (e) => {
    if (isPasteMode) return;
    const target = e.target;
    if (!target.classList.contains("cell")) return;
    const idx = Array.from(gridElement.childNodes).indexOf(target);
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    isSelecting = true;
    selectionStart = { row, col };
    selectionEnd = { row, col };
    updateGrid();
});

gridElement.addEventListener("mouseover", (e) => {
    if (!isSelecting || isPasteMode) return;
    const target = e.target;
    if (!target.classList.contains("cell")) return;
    const idx = Array.from(gridElement.childNodes).indexOf(target);
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    selectionEnd = { row, col };
    updateGrid();
});

document.addEventListener("mouseup", () => {
    if (isSelecting && !isPasteMode) {
        isSelecting = false;
        updateGrid();
    }
});

