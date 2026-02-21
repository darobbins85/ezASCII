const fileInput = document.getElementById('fileInput');
const asciiPreview = document.getElementById('asciiPreview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const widthInput = document.getElementById('maxWidth');
const heightInput = document.getElementById('maxHeight');
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

let lastUploadedFile = null;
let lastAsciiContent = '';

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        lastUploadedFile = file;
        uploadImage(file);
    }
});

textInput.addEventListener('input', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
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
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

textFontSelect.addEventListener('change', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

textColorInput.addEventListener('change', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

const optionInputs = [widthInput, heightInput, charsetSelect, invertCheckbox, thresholdCheckbox, brightnessInput, contrastInput, flipHCheckbox, flipVCheckbox];
optionInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (lastUploadedFile) {
            uploadImage(lastUploadedFile);
        } else if (textInput.value.trim()) {
            uploadText(textInput.value);
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
    return {
        width: parseInt(widthInput.value) || 200,
        height: parseInt(heightInput.value) || 100,
        charset: charsetSelect.value,
        invert: invertCheckbox.checked,
        threshold: thresholdCheckbox.checked,
        brightness: brightnessInput.value,
        contrast: contrastInput.value,
        flipH: flipHCheckbox.checked,
        flipV: flipVCheckbox.checked
    };
}

async function uploadImage(file) {
    try {
        const options = getOptions();
        const asciiArt = await window.AsciiConverter.convertImageToAscii(file, options);
        
        lastAsciiContent = asciiArt;
        asciiPreview.textContent = asciiArt;
        
        downloadBtn.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(asciiArt);
        downloadBtn.download = `ascii_${Date.now()}.txt`;
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Failed to convert image');
    }
}

async function uploadText(text) {
    const width = parseInt(widthInput.value) || 200;
    const height = parseInt(heightInput.value) || 100;
    const textFont = textFontSelect.value;
    const textSize = parseInt(textSizeInput.value) || 30;
    const textColor = textColorInput.value;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = textSize * 3;
    ctx.font = `${fontSize}px "${textFont}"`;
    const metrics = ctx.measureText(text);
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
        const asciiArt = window.AsciiConverter.convertCanvasToAscii(canvas, options);
        
        lastAsciiContent = asciiArt;
        asciiPreview.textContent = asciiArt;
        
        downloadBtn.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(asciiArt);
        downloadBtn.download = `ascii_${Date.now()}.txt`;
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Failed to convert text');
    }
}
