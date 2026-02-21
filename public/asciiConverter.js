/**
 * Client-side ASCII Art Converter
 * Works entirely in the browser using Canvas API
 */

const ASCII_CHARSETS = {
    simple: ' .:-=+*#%',
    detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    blocks: ' ▓▒░ ',
    minimal: ' .:-#',
    binary: ' █',
    starburst: ' .*+-oO#%@',
    brackets: ' [](){}<>',
    lines: ' |\\/-:.,',
    hash: ' #',
    slash: ' /\\|',
    dot: ' .',
    at: ' @',
    box: ' ▖▗▘▙▚▛▜▝▞▟',
    geometric: ' ┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬',
    braille: ' ⠁⠂⠄⠆⠈⠐⠠⠰⠱⠲⠴⠆⠖⠶⠸⠨⠬⠫⠯⠳⠼⠽⠾'
};

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 100;
const MAX_WIDTH = 300;
const MAX_HEIGHT = 200;
const MIN_DIMENSION = 10;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function parseDimension(value, defaultVal, maxVal) {
    const parsed = parseInt(value) || defaultVal;
    return clamp(parsed, MIN_DIMENSION, maxVal);
}

function calculateContrastFactor(contrastAdj) {
    return (259 * (contrastAdj + 255)) / (255 * (259 - contrastAdj));
}

function applyBrightnessContrast(r, g, b, brightnessAdj, contrastFactor) {
    r = Math.min(255, Math.max(0, r + brightnessAdj));
    g = Math.min(255, Math.max(0, g + brightnessAdj));
    b = Math.min(255, Math.max(0, b + brightnessAdj));

    r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

    return { r: Math.floor(r), g: Math.floor(g), b: Math.floor(b) };
}

function getImageBounds(imageData, width) {
    let minX = width, maxX = 0, minY = imageData.height, maxY = 0;

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const brightnessVal = Math.floor((r + g + b) / 3);

            if (brightnessVal < 250) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (minX >= maxX || minY >= maxY) {
        minX = 0;
        maxX = width - 1;
        minY = 0;
        maxY = imageData.height - 1;
    }

    return { minX, maxX, minY, maxY };
}

function imageDataToAscii(imageData, width, options) {
    const {
        charset = 'detailed',
        invert = false,
        threshold = false,
        brightness = 0,
        contrast = 0,
        flipH = false,
        flipV = false
    } = options;

    let data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;

    if (flipH || flipV) {
        const newData = new Uint8ClampedArray(data.length);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const srcIdx = (y * w + x) * 4;
                const dstX = flipH ? w - 1 - x : x;
                const dstY = flipV ? h - 1 - y : y;
                const dstIdx = (dstY * w + dstX) * 4;
                newData[dstIdx] = data[srcIdx];
                newData[dstIdx + 1] = data[srcIdx + 1];
                newData[dstIdx + 2] = data[srcIdx + 2];
                newData[dstIdx + 3] = data[srcIdx + 3];
            }
        }
        data = newData;
    }

    const brightnessAdj = parseInt(brightness) || 0;
    const contrastAdj = parseInt(contrast) || 0;
    const contrastFactor = calculateContrastFactor(contrastAdj);

    const adjustedData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const adjusted = applyBrightnessContrast(
            data[i], data[i + 1], data[i + 2],
            brightnessAdj, contrastFactor
        );
        adjustedData[i] = adjusted.r;
        adjustedData[i + 1] = adjusted.g;
        adjustedData[i + 2] = adjusted.b;
        adjustedData[i + 3] = data[i + 3];
    }

    const { minX, maxX, minY, maxY } = getImageBounds({ data: adjustedData, height: h }, w);

    const chars = ASCII_CHARSETS[charset] || ASCII_CHARSETS.detailed;
    const charCount = chars.length;

    let asciiArt = '';
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const idx = (y * w + x) * 4;
            const r = adjustedData[idx];
            const g = adjustedData[idx + 1];
            const b = adjustedData[idx + 2];
            let brightnessVal = Math.floor((r + g + b) / 3);

            if (threshold) {
                brightnessVal = brightnessVal >= 128 ? 255 : 0;
            }

            if (invert) {
                brightnessVal = 255 - brightnessVal;
            }

            const charIndex = Math.floor((brightnessVal / 255) * (charCount - 1));
            const char = chars[invert ? charCount - 1 - charIndex : charIndex];
            asciiArt += char;
        }
        asciiArt += '\n';
    }

    return asciiArt.trimEnd();
}

async function convertImageToAscii(imageFile, options = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            const width = parseDimension(options.width, DEFAULT_WIDTH, MAX_WIDTH);
            const height = parseDimension(options.height, DEFAULT_HEIGHT, MAX_HEIGHT);

            const aspectRatio = img.width / img.height;
            let drawWidth = width;
            let drawHeight = height;

            if (aspectRatio > width / height) {
                drawHeight = Math.round(width / aspectRatio);
            } else {
                drawWidth = Math.round(height * aspectRatio);
            }

            canvas.width = drawWidth;
            canvas.height = drawHeight;
            ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

            const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
            const asciiArt = imageDataToAscii(imageData, drawWidth, options);
            resolve(asciiArt);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(imageFile);
    });
}

function convertCanvasToAscii(canvas, options = {}) {
    const width = parseDimension(options.width, DEFAULT_WIDTH, MAX_WIDTH);
    const height = parseDimension(options.height, DEFAULT_HEIGHT, MAX_HEIGHT);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const aspectRatio = canvas.width / canvas.height;
    let drawWidth = width;
    let drawHeight = height;

    if (aspectRatio > width / height) {
        drawHeight = Math.round(width / aspectRatio);
    } else {
        drawWidth = Math.round(height * aspectRatio);
    }

    tempCanvas.width = drawWidth;
    tempCanvas.height = drawHeight;
    tempCtx.drawImage(canvas, 0, 0, drawWidth, drawHeight);

    const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
    return imageDataToAscii(imageData, drawWidth, options);
}

window.AsciiConverter = {
    ASCII_CHARSETS,
    convertImageToAscii,
    convertCanvasToAscii,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MAX_WIDTH,
    MAX_HEIGHT
};
