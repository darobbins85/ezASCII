const fileInput = document.getElementById('fileInput');
const asciiPreview = document.getElementById('asciiPreview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const widthInput = document.getElementById('maxWidth');
const heightInput = document.getElementById('maxHeight');
const toast = document.getElementById('toast');

let lastUploadedFile = null;
let lastAsciiContent = '';

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        lastUploadedFile = file;
        uploadImage(file);
    }
});

widthInput.addEventListener('change', () => {
    if (lastUploadedFile) {
        uploadImage(lastUploadedFile);
    }
});

heightInput.addEventListener('change', () => {
    if (lastUploadedFile) {
        uploadImage(lastUploadedFile);
    }
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
    const formData = new FormData();
    formData.append('image', file);
    formData.append('maxWidth', width);
    formData.append('maxHeight', height);

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
