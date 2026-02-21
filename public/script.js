const fileInput = document.getElementById('fileInput');
const asciiPreview = document.getElementById('asciiPreview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sizeInput = document.getElementById('asciiSize');
const charsetSelect = document.getElementById('charset');
const invertCheckbox = document.getElementById('invert');
const thresholdCheckbox = document.getElementById('threshold');
const brightnessInput = document.getElementById('brightness');
const contrastInput = document.getElementById('contrast');
const flipHCheckbox = document.getElementById('flipH');
const flipVCheckbox = document.getElementById('flipV');
const textInput = document.getElementById('textInput');
const textFontSelect = document.getElementById('textFont');
const textSizeInput = document.getElementById('textSize');
const textColorInput = document.getElementById('textColor');
const toast = document.getElementById('toast');

let lastAsciiContent = '';
let currentMode = 'image';
let currentFile = null;
let currentText = '';

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        currentMode = tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        currentMode = 'image';
        currentFile = file;
        currentText = '';
        uploadImage(file);
    }
});

textInput.addEventListener('input', () => {
    currentText = textInput.value;
    if (currentText.trim()) {
        currentMode = 'text';
        currentFile = null;
        uploadText(currentText);
    }
});

const defaultFonts = [
    'Arial', 'Liberation Sans', 'Courier New', 'Georgia', 'Verdana', 
    'Monaco', 'Menlo', 'Consolas', 'Times New Roman', 'Impact'
];

function populateFonts() {
    textFontSelect.innerHTML = '';
    
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            const availableFonts = [];
            document.fonts.forEach(font => {
                availableFonts.push(font.family);
            });
            
            const fonts = availableFonts.length > 0 ? availableFonts.slice(0, 25) : defaultFonts;
            fonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                textFontSelect.appendChild(option);
            });
            
            if (textFontSelect.options.length > 0) {
                textFontSelect.value = 'Liberation Sans';
            }
        }).catch(() => {
            populateDefaultFonts();
        });
    } else {
        populateDefaultFonts();
    }
}

function populateDefaultFonts() {
    defaultFonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        textFontSelect.appendChild(option);
    });
}

populateFonts();

textSizeInput.addEventListener('change', () => {
    if (currentText.trim() && currentMode === 'text') {
        uploadText(currentText);
    }
});

textFontSelect.addEventListener('change', () => {
    if (currentText.trim() && currentMode === 'text') {
        uploadText(currentText);
    }
});

textColorInput.addEventListener('change', () => {
    if (currentText.trim() && currentMode === 'text') {
        uploadText(currentText);
    }
});

const optionInputs = [sizeInput, charsetSelect, invertCheckbox, thresholdCheckbox, brightnessInput, contrastInput, flipHCheckbox, flipVCheckbox];
optionInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (currentMode === 'image' && currentFile) {
            uploadImage(currentFile);
        } else if (currentMode === 'text' && currentText.trim()) {
            uploadText(currentText);
        }
    });
});

copyBtn.addEventListener('click', async () => {
    if (lastAsciiContent) {
        try {
            await navigator.clipboard.writeText(lastAsciiContent);
            showToast('Copied to clipboard!');
        } catch (err) {
            showToast('Failed to copy');
        }
    }
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function getOptions() {
    const size = parseInt(sizeInput.value) || 100;
    return {
        width: size,
        height: Math.round(size * 0.5),
        charset: charsetSelect.value,
        invert: invertCheckbox.checked,
        threshold: thresholdCheckbox.checked,
        brightness: brightnessInput.value,
        contrast: contrastInput.value,
        flipH: flipHCheckbox.checked,
        flipV: flipVCheckbox.checked
    };
}

function renderColoredAscii(coloredData) {
    let html = '';
    for (const line of coloredData.lines) {
        for (const charObj of line.chars) {
            html += `<span style="color: ${charObj.color}">${escapeHtml(charObj.char)}</span>`;
        }
        html += '\n';
    }
    asciiPreview.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function calculateOptimalDimensions(imgWidth, imgHeight) {
    const aspectRatio = imgWidth / imgHeight;
    
    let optimalWidth;
    let optimalHeight;
    
    if (aspectRatio > 2) {
        optimalWidth = 300;
        optimalHeight = Math.round(300 / aspectRatio);
    } else if (aspectRatio > 1) {
        optimalWidth = 200;
        optimalHeight = Math.round(200 / aspectRatio);
    } else if (aspectRatio < 0.5) {
        optimalHeight = 200;
        optimalWidth = Math.round(200 * aspectRatio);
    } else {
        optimalHeight = 150;
        optimalWidth = Math.round(150 * aspectRatio);
    }
    
    optimalWidth = Math.max(50, Math.min(300, optimalWidth));
    optimalHeight = Math.max(30, Math.min(150, optimalHeight));
    
    return { width: optimalWidth, height: optimalHeight };
}

async function uploadImage(file) {
    try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
        });
        
        const { width: optimalWidth } = calculateOptimalDimensions(img.width, img.height);
        
        URL.revokeObjectURL(objectUrl);
        
        const options = getOptions();
        const coloredAscii = await window.AsciiConverter.convertImageToColoredAscii(file, options);
        
        renderColoredAscii(coloredAscii);
        
        let plainAscii = '';
        for (const line of coloredAscii.lines) {
            for (const charObj of line.chars) {
                plainAscii += charObj.char;
            }
            plainAscii += '\n';
        }
        lastAsciiContent = plainAscii.trimEnd();
        
        const blob = new Blob([lastAsciiContent], { type: 'text/plain' });
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = `ascii_${Date.now()}.txt`;
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Failed to convert image');
    }
}

async function uploadText(text) {
    const size = parseInt(sizeInput.value) || 100;
    const width = size;
    const height = Math.round(size * 0.5);
    const textFont = textFontSelect.value;
    const textSize = parseInt(textSizeInput.value) || 30;
    const textColor = textColorInput.value;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = textSize * 3;
    ctx.font = `${fontSize}px "${textFont}"`;
    const lineHeight = fontSize * 1.2;
    const lines = text.split('\n');
    const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const canvasWidth = maxLineWidth + 40;
    const canvasHeight = lines.length * lineHeight + 40;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `${fontSize}px "${textFont}"`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    let yOffset = 20;
    for (const line of lines) {
        ctx.fillText(line, 20, yOffset);
        yOffset += lineHeight;
    }

    try {
        const options = getOptions();
        const coloredAscii = window.AsciiConverter.convertCanvasToColoredAscii(canvas, options);
        
        renderColoredAscii(coloredAscii);
        
        let plainAscii = '';
        for (const line of coloredAscii.lines) {
            for (const charObj of line.chars) {
                plainAscii += charObj.char;
            }
            plainAscii += '\n';
        }
        lastAsciiContent = plainAscii.trimEnd();
        
        const blob = new Blob([lastAsciiContent], { type: 'text/plain' });
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = `ascii_${Date.now()}.txt`;
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Failed to convert text');
    }
}

async function loadDefaultPreview() {
    try {
        const response = await fetch('ramen.png');
        const blob = await response.blob();
        const file = new File([blob], 'ramen.png', { type: 'image/png' });
        
        currentFile = file;
        currentMode = 'image';
        
        const options = getOptions();
        const coloredAscii = await window.AsciiConverter.convertImageToColoredAscii(file, options);
        
        renderColoredAscii(coloredAscii);
        
        let plainAscii = '';
        for (const line of coloredAscii.lines) {
            for (const charObj of line.chars) {
                plainAscii += charObj.char;
            }
            plainAscii += '\n';
        }
        lastAsciiContent = plainAscii.trimEnd();
        
        const blob2 = new Blob([lastAsciiContent], { type: 'text/plain' });
        downloadBtn.href = URL.createObjectURL(blob2);
        downloadBtn.download = `ascii_${Date.now()}.txt`;
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
    } catch (error) {
        console.error('Failed to load default preview:', error);
    }
}

loadDefaultPreview();
