window.musicBlocksInstance = {
    turtles: {
        turtleList: [{
            x: 0,
            y: 0,
            playNote: (note, duration) => {
                console.log(`Playing note ${note} for ${duration} seconds`);
                displayNote(note);
                playNoteWithWebAudio(note, duration);
            }
        }]
    }
};

// DOM Elements
const imageInput = document.getElementById("imageInput");
const imageCanvas = document.getElementById("imageCanvas");
const videoCanvas = document.getElementById("videoCanvas");
const turtle = document.getElementById("turtle");
const video = document.getElementById("video");
const noteDisplay = document.getElementById("noteDisplay");
const scanImageBtn = document.getElementById("scanImage");
const playSequenceBtn = document.getElementById("playSequence");
const startWebcamBtn = document.getElementById("startWebcam");
const detectColorBtn = document.getElementById("detectColorFromWebcam");
const continuousScanBtn = document.getElementById("continuousScan");
const legoGrid = document.getElementById("legoGrid");
const playCustomBtn = document.getElementById("playCustomSequence");
const clearGridBtn = document.getElementById("clearGrid");

// Create context
const ctxImage = imageCanvas.getContext("2d");
const ctxVideo = videoCanvas.getContext("2d");

// Color to note mapping
const colorToNoteMap = {
    'red': { color: 'rgb(255, 0, 0)', note: 'C4' },
    'blue': { color: 'rgb(0, 0, 255)', note: 'D4' },
    'yellow': { color: 'rgb(255, 255, 0)', note: 'E4' },
    'green': { color: 'rgb(0, 255, 0)', note: 'F4' },
    'black': { color: 'rgb(0, 0, 0)', note: 'G4' },
    'white': { color: 'rgb(255, 255, 255)', note: 'A4' },
    'orange': { color: 'rgb(255, 165, 0)', note: 'B4' }
};

// Store the current sequence
let currentSequence = [];
let continuousScanInterval = null;

// Create audio context for playing notes
let audioContext = null;

// Initialize audio context on user interaction
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Map note names to frequencies
const noteToFreq = {
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88
};

// Play a note using Web Audio API
function playNoteWithWebAudio(note, duration) {
    initAudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = noteToFreq[note] || 440;
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// Display note on screen
function displayNote(note) {
    noteDisplay.textContent = `Note: ${note}`;
    
    // Clear after 1 second
    setTimeout(() => {
        noteDisplay.textContent = "Note: -";
    }, 1000);
}

// 1. Image Color Detection
imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    loadImage(file);
});

function loadImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;
        ctxImage.drawImage(img, 0, 0);
    };
}

// Move turtle over image
imageCanvas.addEventListener("mousemove", (event) => {
    const rect = imageCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Position turtle
    turtle.style.left = `${x + rect.left}px`;
    turtle.style.top = `${y + rect.top}px`;
    
    // Get color under turtle
    const pixel = ctxImage.getImageData(x, y, 1, 1).data;
    const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    
    // Update turtle color to show current color
    turtle.style.backgroundColor = color;
});

// Detect color on click
imageCanvas.addEventListener("click", (event) => {
    const rect = imageCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Get color under turtle
    const pixel = ctxImage.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    // Find closest color
    let closestColor = null;
    let smallestDistance = Infinity;
    
    for (const [name, data] of Object.entries(colorToNoteMap)) {
        const colorParts = data.color.match(/\d+/g).map(Number);
        const dr = colorParts[0] - r;
        const dg = colorParts[1] - g;
        const db = colorParts[2] - b;
        const distance = Math.sqrt(dr*dr + dg*dg + db*db);
        
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestColor = name;
        }
    }
    
    if (closestColor && smallestDistance < 150) {
        const noteData = colorToNoteMap[closestColor];
        playNoteWithWebAudio(noteData.note, 1);
        displayNote(noteData.note);
    }
});

// 2. Webcam functionality
startWebcamBtn.addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Error accessing webcam:", err);
            alert("Could not access webcam. Please check permissions.");
        });
});

// Detect color from webcam
detectColorBtn.addEventListener("click", () => {
    // Capture current frame
    videoCanvas.width = video.videoWidth;
    videoCanvas.height = video.videoHeight;
    ctxVideo.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
    
    // Get center pixel
    const x = Math.floor(videoCanvas.width / 2);
    const y = Math.floor(videoCanvas.height / 2);
    
    const pixel = ctxVideo.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    // Find closest color
    let closestColor = null;
    let smallestDistance = Infinity;
    
    for (const [name, data] of Object.entries(colorToNoteMap)) {
        const colorParts = data.color.match(/\d+/g).map(Number);
        const dr = colorParts[0] - r;
        const dg = colorParts[1] - g;
        const db = colorParts[2] - b;
        const distance = Math.sqrt(dr*dr + dg*dg + db*db);
        
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestColor = name;
        }
    }
    
    if (closestColor && smallestDistance < 150) {
        const noteData = colorToNoteMap[closestColor];
        playNoteWithWebAudio(noteData.note, 1);
        displayNote(noteData.note);
    }
});

// Continuous scanning function
continuousScanBtn.addEventListener("click", () => {
    if (continuousScanInterval) {
        // Stop scanning if already running
        clearInterval(continuousScanInterval);
        continuousScanInterval = null;
        continuousScanBtn.textContent = "Start Continuous Scan";
        return;
    }
    
    // Start continuous scanning
    continuousScanBtn.textContent = "Stop Continuous Scan";
    
    continuousScanInterval = setInterval(() => {
        if (!video.srcObject) return;
        
        // Capture current frame
        videoCanvas.width = video.videoWidth;
        videoCanvas.height = video.videoHeight;
        ctxVideo.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
        
        // Get center pixel
        const x = Math.floor(videoCanvas.width / 2);
        const y = Math.floor(videoCanvas.height / 2);
        
        const pixel = ctxVideo.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        
        // Find closest color
        let closestColor = null;
        let smallestDistance = Infinity;
        
        for (const [name, data] of Object.entries(colorToNoteMap)) {
            const colorParts = data.color.match(/\d+/g).map(Number);
            const dr = colorParts[0] - r;
            const dg = colorParts[1] - g;
            const db = colorParts[2] - b;
            const distance = Math.sqrt(dr*dr + dg*dg + db*db);
            
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestColor = name;
            }
        }
        
        if (closestColor && smallestDistance < 150) {
            const noteData = colorToNoteMap[closestColor];
            playNoteWithWebAudio(noteData.note, 0.5);
            displayNote(noteData.note);
        }
    }, 1000); // Check every second
});

// 3. Create custom Lego music grid
function createLegoGrid() {
    const colors = Object.keys(colorToNoteMap);
    
    // Create grid cells
    for (let i = 0; i < 32; i++) {
        const cell = document.createElement("div");
        cell.className = "lego-cell";
        cell.style.backgroundColor = "white";
        cell.dataset.colorIndex = "5"; // White is index 5
        
        cell.addEventListener("click", () => {
            // Cycle through colors
            const currentIndex = parseInt(cell.dataset.colorIndex);
            const nextIndex = (currentIndex + 1) % colors.length;
            const nextColor = colors[nextIndex];
            
            cell.style.backgroundColor = colorToNoteMap[nextColor].color;
            cell.dataset.colorIndex = nextIndex;
            
            // Play the note
            playNoteWithWebAudio(colorToNoteMap[nextColor].note, 0.5);
            displayNote(colorToNoteMap[nextColor].note);
        });
        
        legoGrid.appendChild(cell);
    }
}

// Play custom sequence
playCustomBtn.addEventListener("click", () => {
    const cells = Array.from(legoGrid.querySelectorAll(".lego-cell"));
    let currentTime = 0;
    
    cells.forEach(cell => {
        const colorIndex = parseInt(cell.dataset.colorIndex);
        const colorName = Object.keys(colorToNoteMap)[colorIndex];
        const note = colorToNoteMap[colorName].note;
        
        setTimeout(() => {
            cell.style.opacity = 0.5;
            playNoteWithWebAudio(note, 0.5);
            displayNote(note);
            
            setTimeout(() => {
                cell.style.opacity = 1;
            }, 500);
        }, currentTime * 1000);
        
        currentTime += 0.5;
    });
});

// Clear grid
clearGridBtn.addEventListener("click", () => {
    const cells = legoGrid.querySelectorAll(".lego-cell");
    cells.forEach(cell => {
        cell.style.backgroundColor = "white";
        cell.dataset.colorIndex = "5";
    });
});

// Scan image to create sequence
scanImageBtn.addEventListener("click", () => {
    // Create a sequence by scanning the image in a grid pattern
    const sequence = [];
    const gridSize = 5; // Number of rows and columns to sample
    
    const width = imageCanvas.width;
    const height = imageCanvas.height;
    
    // Scan in a grid pattern
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const x = Math.floor(width * col / gridSize + width / (2 * gridSize));
            const y = Math.floor(height * row / gridSize + height / (2 * gridSize));
            
            const pixel = ctxImage.getImageData(x, y, 1, 1).data;
            const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
            
            // Find closest color
            let closestColor = null;
            let smallestDistance = Infinity;
            
            for (const [name, data] of Object.entries(colorToNoteMap)) {
                const colorParts = data.color.match(/\d+/g).map(Number);
                const dr = colorParts[0] - r;
                const dg = colorParts[1] - g;
                const db = colorParts[2] - b;
                const distance = Math.sqrt(dr*dr + dg*dg + db*db);
                
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    closestColor = name;
                }
            }
            
            if (closestColor && smallestDistance < 150) {
                // Create scan marker to show where we're scanning
                const marker = document.createElement("div");
                marker.className = "progress-marker";
                marker.style.width = `${width/gridSize}px`;
                marker.style.height = `${height/gridSize}px`;
                marker.style.left = `${x - width/(2*gridSize)}px`;
                marker.style.top = `${y - height/(2*gridSize)}px`;
                
                const parentRect = imageCanvas.getBoundingClientRect();
                marker.style.left = `${parentRect.left + x - width/(2*gridSize)}px`;
                marker.style.top = `${parentRect.top + y - height/(2*gridSize)}px`;
                
                document.body.appendChild(marker);
                
                // Remove marker after animation
                setTimeout(() => {
                    document.body.removeChild(marker);
                }, 500);
                
                // Add to sequence
                sequence.push({
                    note: colorToNoteMap[closestColor].note,
                    duration: 0.5,
                    position: { x, y },
                    color: colorToNoteMap[closestColor].color
                });
            }
        }
    }
    
    // Store sequence for playing later
    currentSequence = sequence;
    
    // Show animation of the scan
    let animIndex = 0;
    const animateSequence = () => {
        if (animIndex < sequence.length) {
            const { note, position, color } = sequence[animIndex];
            
            // Move turtle and change its color
            const { x, y } = position;
            turtle.style.left = `${imageCanvas.getBoundingClientRect().left + x}px`;
            turtle.style.top = `${imageCanvas.getBoundingClientRect().top + y}px`;
            turtle.style.backgroundColor = color;
            
            // Play note
            playNoteWithWebAudio(note, 0.2);
            displayNote(note);
            
            animIndex++;
            setTimeout(animateSequence, 300);
        }
    };
    
    animateSequence();
});

// Play the sequence generated from the image
playSequenceBtn.addEventListener("click", () => {
    if (currentSequence.length === 0) {
        alert("Please scan an image first to create a sequence.");
        return;
    }
    
    let currentTime = 0;
    
    currentSequence.forEach((item, index) => {
        const { note, duration, position, color } = item;
        
        setTimeout(() => {
            // Move turtle to position
            turtle.style.left = `${imageCanvas.getBoundingClientRect().left + position.x}px`;
            turtle.style.top = `${imageCanvas.getBoundingClientRect().top + position.y}px`;
            turtle.style.backgroundColor = color;
            
            // Play note
            playNoteWithWebAudio(note, duration);
            displayNote(note);
            
            // Visual feedback
            turtle.style.transform = "translate(-50%, -50%) scale(1.5)";
            setTimeout(() => {
                turtle.style.transform = "translate(-50%, -50%) scale(1)";
            }, duration * 500);
            
        }, currentTime * 1000);
        
        currentTime += duration;
    });
});

// Initialize components
window.addEventListener("load", () => {
    createLegoGrid();
    
    // Position turtle initially
    const imageRect = imageCanvas.getBoundingClientRect();
    turtle.style.left = `${imageRect.left + imageRect.width/2}px`;
    turtle.style.top = `${imageRect.top + imageRect.height/2}px`;
});