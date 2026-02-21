const { Jimp, rgbaToInt } = require('jimp');

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

function parseBrightnessContrast(value) {
    return parseInt(value) || 0;
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

function getImageBounds(image) {
    let minX = image.width, maxX = 0, minY = image.height, maxY = 0;

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixel = image.getPixelColor(x, y);
            const br = (pixel >> 24) & 255;
            const bg = (pixel >> 16) & 255;
            const bb = (pixel >> 8) & 255;
            const brightnessVal = Math.floor((br + bg + bb) / 3);

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
        maxX = image.width - 1;
        minY = 0;
        maxY = image.height - 1;
    }

    return { minX, maxX, minY, maxY };
}

function imageToAscii(image, options) {
    const {
        charset = 'detailed',
        invert = false,
        threshold = false,
        brightness = 0,
        contrast = 0,
        flipH = false,
        flipV = false
    } = options;

    if (flipH) image.flip({ horizontal: true, vertical: false });
    if (flipV) image.flip({ horizontal: false, vertical: true });

    const brightnessAdj = parseBrightnessContrast(brightness);
    const contrastAdj = parseBrightnessContrast(contrast);
    const contrastFactor = calculateContrastFactor(contrastAdj);

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            let pixel = image.getPixelColor(x, y);
            let r = (pixel >> 24) & 255;
            let g = (pixel >> 16) & 255;
            let b = (pixel >> 8) & 255;

            const adjusted = applyBrightnessContrast(r, g, b, brightnessAdj, contrastFactor);
            pixel = rgbaToInt(adjusted.r, adjusted.g, adjusted.b, 255);
            image.setPixelColor(pixel, x, y);
        }
    }

    const { minX, maxX, minY, maxY } = getImageBounds(image);
    const chars = ASCII_CHARSETS[charset] || ASCII_CHARSETS.detailed;
    const charCount = chars.length;

    let asciiArt = '';
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const pixel = image.getPixelColor(x, y);
            const r = (pixel >> 24) & 255;
            const g = (pixel >> 16) & 255;
            const b = (pixel >> 8) & 255;
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

async function convertToAscii(imagePath, options = {}) {
    const width = parseDimension(options.width, DEFAULT_WIDTH, MAX_WIDTH);
    const height = parseDimension(options.height, DEFAULT_HEIGHT, MAX_HEIGHT);

    const image = await Jimp.read(imagePath);
    await image.resize({ w: width, h: height });

    return imageToAscii(image, options);
}

async function processImageData(imageDataObj, options = {}) {
    const width = parseDimension(options.width, DEFAULT_WIDTH, MAX_WIDTH);
    const height = parseDimension(options.height, DEFAULT_HEIGHT, MAX_HEIGHT);

    const image = new Jimp({ width: imageDataObj.width, height: imageDataObj.height });

    for (let y = 0; y < imageDataObj.height; y++) {
        for (let x = 0; x < imageDataObj.width; x++) {
            const idx = (y * imageDataObj.width + x) * 4;
            const r = imageDataObj.data[idx];
            const g = imageDataObj.data[idx + 1];
            const b = imageDataObj.data[idx + 2];
            const a = imageDataObj.data[idx + 3];
            const color = rgbaToInt(r, g, b, a);
            image.setPixelColor(color, x, y);
        }
    }

    await image.resize({ w: width, h: height });

    return imageToAscii(image, options);
}

function getAvailableFonts(fallbackFonts) {
    const defaultFonts = fallbackFonts || ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Monaco', 'Menlo', 'Consolas'];
    return defaultFonts;
}

module.exports = {
    ASCII_CHARSETS,
    convertToAscii,
    processImageData,
    getAvailableFonts,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MAX_WIDTH,
    MAX_HEIGHT,
    MIN_DIMENSION
};
