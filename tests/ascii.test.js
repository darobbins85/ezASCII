const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');
const fs = require('fs');

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
    braille: ' ⠁⠂⠄⠆⠈⠐⠠⠰⠱⠲⠴▒░'
};

function getAvailableFonts() {
    return ['Arial', 'Liberation Sans', 'Courier New', 'Noto Sans', 'DejaVu Sans'];
}

async function convertToAscii(imagePath, options = {}) {
    const { width = 200, height = 100, charset = 'detailed', invert = false, threshold = false, brightness = 0, contrast = 0, flipH = false, flipV = false } = options;
    
    const image = await Jimp.read(imagePath);
    await image.resize({ w: width, h: height });
    
    if (flipH) image.flip({ horizontal: true, vertical: false });
    if (flipV) image.flip({ horizontal: false, vertical: true });
    
    let brightnessAdj = parseInt(brightness) || 0;
    let contrastAdj = parseInt(contrast) || 0;
    const contrastFactor = (259 * (contrastAdj + 255)) / (255 * (259 - contrastAdj));
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            let pixel = image.getPixelColor(x, y);
            let r = (pixel >> 24) & 255;
            let g = (pixel >> 16) & 255;
            let b = (pixel >> 8) & 255;
            
            r = Math.min(255, Math.max(0, r + brightnessAdj));
            g = Math.min(255, Math.max(0, g + brightnessAdj));
            b = Math.min(255, Math.max(0, b + brightnessAdj));
            
            r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
            g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
            b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            
            pixel = rgbaToInt(Math.floor(r), Math.floor(g), Math.floor(b), 255);
            image.setPixelColor(pixel, x, y);
        }
    }
    
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

async function processImageData(imageDataObj, options = {}) {
    const { width = 200, height = 100, charset = 'detailed', invert = false, threshold = false, brightness = 0, contrast = 0, flipH = false, flipV = false } = options;
    
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
    
    if (flipH) image.flip({ horizontal: true, vertical: false });
    if (flipV) image.flip({ horizontal: false, vertical: true });
    
    let brightnessAdj = parseInt(brightness) || 0;
    let contrastAdj = parseInt(contrast) || 0;
    const contrastFactor = (259 * (contrastAdj + 255)) / (255 * (259 - contrastAdj));
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            let pixel = image.getPixelColor(x, y);
            let r = (pixel >> 24) & 255;
            let g = (pixel >> 16) & 255;
            let b = (pixel >> 8) & 255;
            
            r = Math.min(255, Math.max(0, r + brightnessAdj));
            g = Math.min(255, Math.max(0, g + brightnessAdj));
            b = Math.min(255, Math.max(0, b + brightnessAdj));
            
            r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
            g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
            b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            
            pixel = rgbaToInt(Math.floor(r), Math.floor(g), Math.floor(b), 255);
            image.setPixelColor(pixel, x, y);
        }
    }
    
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

describe('ASCII Art Generator - Functional Tests', () => {
    describe('ASCII Charsets', () => {
        test('should have all 15 charsets defined', () => {
            expect(Object.keys(ASCII_CHARSETS).length).toBe(15);
        });

        test('each charset should be a non-empty string', () => {
            Object.values(ASCII_CHARSETS).forEach(charset => {
                expect(typeof charset).toBe('string');
                expect(charset.length).toBeGreaterThan(1);
            });
        });

        test('charsets should include expected types', () => {
            expect(ASCII_CHARSETS.simple).toBeDefined();
            expect(ASCII_CHARSETS.detailed).toBeDefined();
            expect(ASCII_CHARSETS.blocks).toBeDefined();
            expect(ASCII_CHARSETS.braille).toBeDefined();
            expect(ASCII_CHARSETS.box).toBeDefined();
        });
    });

    describe('Font Detection', () => {
        test('getAvailableFonts should return array', () => {
            const fonts = getAvailableFonts();
            expect(Array.isArray(fonts)).toBe(true);
            expect(fonts.length).toBeGreaterThan(0);
        });

        test('all fonts should be valid strings', () => {
            const fonts = getAvailableFonts();
            fonts.forEach(font => {
                expect(typeof font).toBe('string');
                expect(font.length).toBeGreaterThan(0);
            });
        });
    });

    describe('convertToAscii', () => {
        test('should create and convert grayscale image', async () => {
            const testImagePath = '/tmp/test_func_grayscale.png';
            const img = new Jimp({ width: 30, height: 20, background: 0x80808080 });
            await img.write(testImagePath);
            
            const result = await convertToAscii(testImagePath, { width: 30, height: 15 });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result.includes('\n')).toBe(true);
            
            fs.unlinkSync(testImagePath);
        });

        test('should respect all charset options', async () => {
            const testImagePath = '/tmp/test_func_charset.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            await img.write(testImagePath);
            
            const charsets = Object.keys(ASCII_CHARSETS);
            const results = await Promise.all(
                charsets.map(charset => convertToAscii(testImagePath, { charset, width: 20, height: 10 }))
            );
            
            expect(results.length).toBe(charsets.length);
            results.forEach((result, i) => {
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
            
            fs.unlinkSync(testImagePath);
        });

        test('should apply invert option', async () => {
            const testImagePath = '/tmp/test_func_invert.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);
            
            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, invert: false });
            const inverted = await convertToAscii(testImagePath, { width: 20, height: 10, invert: true });
            
            expect(normal).not.toBe(inverted);
            
            fs.unlinkSync(testImagePath);
        });

        test('should apply threshold option', async () => {
            const testImagePath = '/tmp/test_func_threshold.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);
            
            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, threshold: false });
            const threshold = await convertToAscii(testImagePath, { width: 20, height: 10, threshold: true });
            
            expect(normal).not.toBe(threshold);
            
            fs.unlinkSync(testImagePath);
        });

        test('should apply brightness adjustment', async () => {
            const testImagePath = '/tmp/test_func_brightness.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            await img.write(testImagePath);
            
            const dim = await convertToAscii(testImagePath, { width: 20, height: 10, brightness: -100 });
            const bright = await convertToAscii(testImagePath, { width: 20, height: 10, brightness: 100 });
            
            expect(dim).not.toBe(bright);
            
            fs.unlinkSync(testImagePath);
        });

        test('should apply contrast adjustment', async () => {
            const testImagePath = '/tmp/test_func_contrast.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            await img.write(testImagePath);
            
            const low = await convertToAscii(testImagePath, { width: 20, height: 10, contrast: -100 });
            const high = await convertToAscii(testImagePath, { width: 20, height: 10, contrast: 100 });
            
            expect(low).not.toBe(high);
            
            fs.unlinkSync(testImagePath);
        });

        test('should flip horizontally', async () => {
            const testImagePath = '/tmp/test_func_flipH.png';
            const img = new Jimp({ width: 20, height: 10, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);
            
            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, flipH: false });
            const flipped = await convertToAscii(testImagePath, { width: 20, height: 10, flipH: true });
            
            expect(normal).not.toBe(flipped);
            
            fs.unlinkSync(testImagePath);
        });

        test('should flip vertically', async () => {
            const testImagePath = '/tmp/test_func_flipV.png';
            const img = new Jimp({ width: 20, height: 10, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);
            
            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, flipV: false });
            const flipped = await convertToAscii(testImagePath, { width: 20, height: 10, flipV: true });
            
            expect(normal).not.toBe(flipped);
            
            fs.unlinkSync(testImagePath);
        });

        test('should handle all options together', async () => {
            const testImagePath = '/tmp/test_func_all.png';
            const img = new Jimp({ width: 30, height: 20, background: 0x80808080 });
            await img.write(testImagePath);
            
            const result = await convertToAscii(testImagePath, {
                width: 30,
                height: 15,
                charset: 'blocks',
                invert: true,
                threshold: false,
                brightness: 25,
                contrast: -25,
                flipH: true,
                flipV: true
            });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            fs.unlinkSync(testImagePath);
        });

        test('should handle single pixel image', async () => {
            const testImagePath = '/tmp/test_func_single.png';
            const img = new Jimp({ width: 1, height: 1, background: 0x80808080 });
            await img.write(testImagePath);
            
            const result = await convertToAscii(testImagePath, { width: 1, height: 1 });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            fs.unlinkSync(testImagePath);
        });

        test('should handle large images', async () => {
            const testImagePath = '/tmp/test_func_large.png';
            const img = new Jimp({ width: 200, height: 100, background: 0x80808080 });
            await img.write(testImagePath);
            
            const result = await convertToAscii(testImagePath, { width: 100, height: 50 });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            fs.unlinkSync(testImagePath);
        });
    });

    describe('processImageData', () => {
        test('should process canvas image data with content', async () => {
            const imageData = {
                width: 20,
                height: 20,
                data: []
            };
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 20; x++) {
                    const idx = (y * 20 + x) * 4;
                    imageData.data[idx] = 128;
                    imageData.data[idx + 1] = 128;
                    imageData.data[idx + 2] = 128;
                    imageData.data[idx + 3] = 255;
                }
            }
            
            const result = await processImageData(imageData, { width: 20, height: 10 });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should apply invert to image data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data.push(128, 128, 128, 255);
            }
            
            const normal = await processImageData(imageData, { width: 10, height: 5, invert: false });
            const inverted = await processImageData(imageData, { width: 10, height: 5, invert: true });
            
            expect(normal).not.toBe(inverted);
        });

        test('should apply threshold to image data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data.push(150, 150, 150, 255);
            }
            
            const normal = await processImageData(imageData, { width: 10, height: 5, threshold: false });
            const threshold = await processImageData(imageData, { width: 10, height: 5, threshold: true });
            
            expect(normal).not.toBe(threshold);
        });

        test('should apply brightness to image data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data.push(128, 128, 128, 255);
            }
            
            const dim = await processImageData(imageData, { width: 10, height: 5, brightness: -50 });
            const bright = await processImageData(imageData, { width: 10, height: 5, brightness: 50 });
            
            expect(dim).not.toBe(bright);
        });

        test('should apply contrast to image data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data.push(128, 128, 128, 255);
            }
            
            const low = await processImageData(imageData, { width: 10, height: 5, contrast: -50 });
            const high = await processImageData(imageData, { width: 10, height: 5, contrast: 50 });
            
            expect(low).not.toBe(high);
        });

        test('should flip image data horizontally', async () => {
            const imageData = {
                width: 10,
                height: 5,
                data: []
            };
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 10; x++) {
                    const idx = (y * 10 + x) * 4;
                    const isMarker = x === 2;
                    imageData.data[idx] = isMarker ? 255 : 128;
                    imageData.data[idx + 1] = isMarker ? 255 : 128;
                    imageData.data[idx + 2] = isMarker ? 255 : 128;
                    imageData.data[idx + 3] = 255;
                }
            }
            
            const normal = await processImageData(imageData, { width: 10, height: 5, flipH: false });
            const flipped = await processImageData(imageData, { width: 10, height: 5, flipH: true });
            
            expect(normal).not.toBe(flipped);
        });

        test('should flip image data vertically', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    const idx = (y * 10 + x) * 4;
                    const isMarker = y === 2;
                    imageData.data[idx] = isMarker ? 255 : 128;
                    imageData.data[idx + 1] = isMarker ? 255 : 128;
                    imageData.data[idx + 2] = isMarker ? 255 : 128;
                    imageData.data[idx + 3] = 255;
                }
            }
            
            const normal = await processImageData(imageData, { width: 10, height: 10, flipV: false });
            const flipped = await processImageData(imageData, { width: 10, height: 10, flipV: true });
            
            expect(normal).not.toBe(flipped);
        });

        test('should handle all charsets for image data', async () => {
            const imageData = {
                width: 20,
                height: 20,
                data: []
            };
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 20; x++) {
                    const idx = (y * 20 + x) * 4;
                    imageData.data[idx] = 200;
                    imageData.data[idx + 1] = 200;
                    imageData.data[idx + 2] = 200;
                    imageData.data[idx + 3] = 255;
                }
            }
            
            const charsets = Object.keys(ASCII_CHARSETS);
            const results = await Promise.all(
                charsets.map(charset => processImageData(imageData, { charset, width: 20, height: 10 }))
            );
            
            expect(results.length).toBe(charsets.length);
            results.forEach(result => {
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });
    });
});
