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

async function loadFonts() {
    try {
        const response = await fetch('/fonts');
        const data = await response.json();
        textFontSelect.innerHTML = '';
        data.fonts.slice(0, 25).forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            textFontSelect.appendChild(option);
        });
        if (textFontSelect.options.length > 0) {
            textFontSelect.value = 'Liberation Sans';
        }
    } catch (e) {
        console.log('Failed to load fonts, using defaults');
        const defaults = ['Arial', 'Liberation Sans', 'Liberation Serif', 'Courier New', 'Monaco', 'Noto Sans', 'DejaVu Sans'];
        textFontSelect.innerHTML = '';
        defaults.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            textFontSelect.appendChild(option);
        });
    }
}

loadFonts();

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

async function uploadImage(file) {
    const width = widthInput.value;
    const height = heightInput.value;
    const charset = charsetSelect.value;
    const invert = invertCheckbox.checked;
    const threshold = thresholdCheckbox.checked;
    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    const flipH = flipHCheckbox.checked;
    const flipV = flipVCheckbox.checked;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('maxWidth', width);
    formData.append('maxHeight', height);
    formData.append('charset', charset);
    formData.append('invert', invert);
    formData.append('threshold', threshold);
    formData.append('brightness', brightness);
    formData.append('contrast', contrast);
    formData.append('flipH', flipH);
    formData.append('flipV', flipV);
    formData.append('mode', 'image');

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            lastAsciiContent = data.ascii;
            asciiPreview.textContent = data.ascii;
            downloadBtn.href = data.downloadUrl;
            downloadBtn.download = `ascii_${Date.now()}.txt`;
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        } else {
            alert(data.error || 'Failed to convert image');
        }
    } catch (error) {
        console.error(error);
        alert('Failed to upload image');
    }
}

async function uploadText(text) {
    const width = widthInput.value;
    const height = heightInput.value;
    const charset = charsetSelect.value;
    const invert = invertCheckbox.checked;
    const threshold = thresholdCheckbox.checked;
    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    const flipH = flipHCheckbox.checked;
    const flipV = flipVCheckbox.checked;
    const textFont = textFontSelect.value;
    const textSize = textSizeInput.value;
    const textColor = textColorInput.value;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = parseInt(textSize) * 3;
    ctx.font = `${fontSize}px "${textFont}"`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
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
    
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    
    const formData = new FormData();
    formData.append('imageData', JSON.stringify({
        width: imageData.width,
        height: imageData.height,
        data: Array.from(imageData.data)
    }));
    formData.append('maxWidth', width);
    formData.append('maxHeight', height);
    formData.append('charset', charset);
    formData.append('invert', invert);
    formData.append('threshold', threshold);
    formData.append('brightness', brightness);
    formData.append('contrast', contrast);
    formData.append('flipH', flipH);
    formData.append('flipV', flipV);
    formData.append('mode', 'textImage');

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            lastAsciiContent = data.ascii;
            asciiPreview.textContent = data.ascii;
            downloadBtn.href = data.downloadUrl;
            downloadBtn.download = `ascii_${Date.now()}.txt`;
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        } else {
            alert(data.error || 'Failed to convert text');
        }
    } catch (error) {
        console.error(error);
        alert('Failed to convert text');
    }
}
