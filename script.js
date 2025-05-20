const rows = 50;
const cols = 50;
let grid = [];
let isDrawing = false;
let isErasing = false;
let intervalId;
let speed = 100; // Default speed in ms
let aliveCellColor = '#f39c12'; // Default alive cell color
let stepCount = 0; // Step counter to track generations

const gridElement = document.getElementById("grid");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const cellColorPicker = document.getElementById("cellColorPicker");
const stepCounterElement = document.getElementById("stepCounter");
const form = document.querySelector('form');
const loadPatternSelect = document.getElementById('loadPatternSelect');

// Initialize the grid with dead cells
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
            rowArray.push(0);
        }
        grid.push(rowArray);
    }

    // Add event listeners to handle drawing when mouse is released
    document.addEventListener('mouseup', stopDrawing);
}

// Start drawing when the mouse is pressed down
function startDrawing(row, col) {
    isDrawing = true;
    isErasing = grid[row][col] === 1; // If the cell is alive, switch to erasing mode
    toggleCell(row, col);
}

// Continue drawing or erasing as the mouse moves over the cells
function dragDrawing(row, col) {
    if (isDrawing) {
        grid[row][col] = isErasing ? 0 : 1; // Set the cell state based on whether we are drawing or erasing
        updateGrid();
    }
}

// Stop drawing when the mouse button is released
function stopDrawing() {
    isDrawing = false;
}

// Toggle the cell's state between alive and dead
function toggleCell(row, col) {
    grid[row][col] = grid[row][col] ? 0 : 1;
    updateGrid();
}

// Update the display of the grid
function updateGrid() {
    gridElement.childNodes.forEach((cell, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        if (grid[row][col] === 1) {
            cell.style.backgroundColor = aliveCellColor; // Use the dynamic color
            cell.style.boxShadow = `0 2px 5px ${aliveCellColor}88`;
        } else {
            cell.style.backgroundColor = '#3e3e3e'; // Inactive cell color
            cell.style.boxShadow = 'none';
        }
    });
}

// Apply the rules of Conway's Game of Life
function getNextGeneration() {
    const nextGrid = grid.map(arr => [...arr]);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const aliveNeighbors = countAliveNeighbors(row, col);
            if (grid[row][col] === 1) {
                if (aliveNeighbors < 2 || aliveNeighbors > 3) {
                    nextGrid[row][col] = 0; // Cell dies
                }
            } else {
                if (aliveNeighbors === 3) {
                    nextGrid[row][col] = 1; // Cell becomes alive
                }
            }
        }
    }

    grid = nextGrid;
    updateGrid();

    // Increment the step counter and update the display
    stepCount++;
    stepCounterElement.textContent = stepCount;
}

// Count the number of alive neighbors for a given cell
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
            aliveCount += grid[newRow][newCol];
        }
        return aliveCount;
    }, 0);
}

// Start the game loop
function startGame() {
    if (!intervalId) {
        intervalId = setInterval(getNextGeneration, speed);
    }
}

// Stop the game loop
function stopGame() {
    clearInterval(intervalId);
    intervalId = null;
}

// Randomize the grid
function randomizeGrid() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            grid[row][col] = Math.random() > 0.7 ? 1 : 0;
        }
    }
    updateGrid();
    stepCount = 0; // Reset step count on randomization
    stepCounterElement.textContent = stepCount;
}

// Clear the grid
function clearGrid() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            grid[row][col] = 0;
        }
    }
    updateGrid();
    stepCount = 0; // Reset step count on clearing the grid
    stepCounterElement.textContent = stepCount;
}

// Save the current grid as a named pattern
function savePattern() {
    const patternName = prompt("Enter a name for your pattern:");
    if (patternName) {
        const patterns = JSON.parse(localStorage.getItem('patterns') || '{}');
        patterns[patternName] = grid;
        localStorage.setItem('patterns', JSON.stringify(patterns));
        updatePatternSelect();
    }
}

// Load a pattern from localStorage
function loadPattern() {
    const selectedPattern = loadPatternSelect.value;
    if (selectedPattern) {
        const patterns = JSON.parse(localStorage.getItem('patterns'));
        grid = patterns[selectedPattern];
        updateGrid();
        stepCount = 0; // Reset step count when a pattern is loaded
        stepCounterElement.textContent = stepCount;
    }
}

// Delete a selected pattern from localStorage
function deletePattern() {
    const selectedPattern = loadPatternSelect.value;
    if (selectedPattern) {
        const confirmDelete = confirm(`Are you sure you want to delete the pattern "${selectedPattern}"?`);
        if (confirmDelete) {
            const patterns = JSON.parse(localStorage.getItem('patterns'));
            delete patterns[selectedPattern];
            localStorage.setItem('patterns', JSON.stringify(patterns));
            updatePatternSelect(); // Update the dropdown after deletion
        }
    } else {
        alert("Please select a pattern to delete.");
    }
}

// Update the pattern dropdown with saved patterns
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

// Event listeners
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
    updateGrid(); // Repaint the grid with new color
});

// Reset button resets speed, color, image, and grid
document.getElementById("resetButton").addEventListener("click", function() {
    speedRange.value = 100;
    speed = 100;
    speedValue.textContent = '100 ms';
    aliveCellColor = '#f39c12';
    aliveCellImage = null; // Clear the image
    cellColorPicker.value = aliveCellColor;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(getNextGeneration, speed);
    }
    updateGrid();
    stepCount = 0;
    stepCounterElement.textContent = stepCount;
});
