const fileInput = document.getElementById('fileInput');
const asciiPreview = document.getElementById('asciiPreview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const widthInput = document.getElementById('maxWidth');
const heightInput = document.getElementById('maxHeight');
const charsetSelect = document.getElementById('charset');
const invertCheckbox = document.getElementById('invert');
const flipHCheckbox = document.getElementById('flipH');
const flipVCheckbox = document.getElementById('flipV');
const textInput = document.getElementById('textInput');
const textSizeInput = document.getElementById('textSize');
const textWeightInput = document.getElementById('textWeight');
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

textSizeInput.addEventListener('change', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

textWeightInput.addEventListener('change', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

textColorInput.addEventListener('change', () => {
    if (textInput.value.trim()) {
        uploadText(textInput.value);
    }
});

const optionInputs = [widthInput, heightInput, charsetSelect, invertCheckbox, flipHCheckbox, flipVCheckbox];
optionInputs.forEach(input => {
    input.addEventListener('change', () => {
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
    const flipH = flipHCheckbox.checked;
    const flipV = flipVCheckbox.checked;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('maxWidth', width);
    formData.append('maxHeight', height);
    formData.append('charset', charset);
    formData.append('invert', invert);
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
    const flipH = flipHCheckbox.checked;
    const flipV = flipVCheckbox.checked;
    const fontSize = textSizeInput.value;
    const textWeight = textWeightInput.value;
    const textColor = textColorInput.value;

    const formData = new FormData();
    formData.append('text', text);
    formData.append('maxWidth', width);
    formData.append('maxHeight', height);
    formData.append('charset', charset);
    formData.append('invert', invert);
    formData.append('flipH', flipH);
    formData.append('flipV', flipV);
    formData.append('fontSize', fontSize);
    formData.append('textWeight', textWeight);
    formData.append('textColor', textColor);
    formData.append('mode', 'text');

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
