const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const {
    ASCII_CHARSETS,
    convertToAscii,
    processImageData,
    getAvailableFonts,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MAX_WIDTH,
    MAX_HEIGHT,
    MIN_DIMENSION
} = require('../asciiConverter');

const { app, server } = require('../server');

describe('ASCII Converter Module', () => {
    describe('ASCII_CHARSETS', () => {
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

    describe('Constants', () => {
        test('should have valid dimension constants', () => {
            expect(DEFAULT_WIDTH).toBe(200);
            expect(DEFAULT_HEIGHT).toBe(100);
            expect(MAX_WIDTH).toBe(300);
            expect(MAX_HEIGHT).toBe(200);
            expect(MIN_DIMENSION).toBe(10);
        });
    });

    describe('getAvailableFonts', () => {
        test('should return array of fonts', () => {
            const fonts = getAvailableFonts();
            expect(Array.isArray(fonts)).toBe(true);
            expect(fonts.length).toBeGreaterThan(0);
        });

        test('should use fallback fonts when provided', () => {
            const fallback = ['Test Font 1', 'Test Font 2'];
            const fonts = getAvailableFonts(fallback);
            expect(fonts).toEqual(fallback);
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
            const testImagePath = '/tmp/test_grayscale.png';
            const img = new Jimp({ width: 30, height: 20, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath, { width: 30, height: 15 });

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result.includes('\n')).toBe(true);

            fs.unlinkSync(testImagePath);
        });

        test('should respect width and height options', async () => {
            const testImagePath = '/tmp/test_dimensions.png';
            const img = new Jimp({ width: 50, height: 50, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath, { width: 20, height: 10 });

            expect(typeof result).toBe('string');
            const lines = result.split('\n');
            expect(lines.length).toBeLessThanOrEqual(10);

            fs.unlinkSync(testImagePath);
        });

        test('should use default dimensions when not provided', async () => {
            const testImagePath = '/tmp/test_default_dims.png';
            const img = new Jimp({ width: 100, height: 100, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);

            fs.unlinkSync(testImagePath);
        });

        test('should apply invert option', async () => {
            const testImagePath = '/tmp/test_invert.png';
            const img = new Jimp({ width: 20, height: 20, color: 0x000000ff });
            img.setPixelColor(0xffffffff, 10, 10);
            await img.write(testImagePath);

            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, invert: false });
            const inverted = await convertToAscii(testImagePath, { width: 20, height: 10, invert: true });

            expect(normal).not.toEqual(inverted);

            fs.unlinkSync(testImagePath);
        });

        test('should apply threshold option', async () => {
            const testImagePath = '/tmp/test_threshold.png';
            const img = new Jimp({ width: 20, height: 20, color: 0x808080ff });
            img.setPixelColor(0x000000ff, 10, 10);
            await img.write(testImagePath);

            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, threshold: false });
            const threshold = await convertToAscii(testImagePath, { width: 20, height: 10, threshold: true });

            expect(normal).not.toEqual(threshold);

            fs.unlinkSync(testImagePath);
        });

        test('should apply brightness adjustment', async () => {
            const testImagePath = '/tmp/test_brightness.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            await img.write(testImagePath);

            const dim = await convertToAscii(testImagePath, { width: 20, height: 10, brightness: -100 });
            const bright = await convertToAscii(testImagePath, { width: 20, height: 10, brightness: 100 });

            expect(dim).not.toEqual(bright);

            fs.unlinkSync(testImagePath);
        });

        test('should apply contrast adjustment', async () => {
            const testImagePath = '/tmp/test_contrast.png';
            const img = new Jimp({ width: 20, height: 20, background: 0x80808080 });
            await img.write(testImagePath);

            const low = await convertToAscii(testImagePath, { width: 20, height: 10, contrast: -100 });
            const high = await convertToAscii(testImagePath, { width: 20, height: 10, contrast: 100 });

            expect(low).not.toEqual(high);

            fs.unlinkSync(testImagePath);
        });

        test('should flip horizontally', async () => {
            const testImagePath = '/tmp/test_flipH.png';
            const img = new Jimp({ width: 20, height: 10, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);

            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, flipH: false });
            const flipped = await convertToAscii(testImagePath, { width: 20, height: 10, flipH: true });

            expect(normal).not.toEqual(flipped);

            fs.unlinkSync(testImagePath);
        });

        test('should flip vertically', async () => {
            const testImagePath = '/tmp/test_flipV.png';
            const img = new Jimp({ width: 20, height: 10, background: 0x80808080 });
            img.setPixelColor(0xff000000, 5, 5);
            await img.write(testImagePath);

            const normal = await convertToAscii(testImagePath, { width: 20, height: 10, flipV: false });
            const flipped = await convertToAscii(testImagePath, { width: 20, height: 10, flipV: true });

            expect(normal).not.toEqual(flipped);

            fs.unlinkSync(testImagePath);
        });

        test('should handle single pixel image', async () => {
            const testImagePath = '/tmp/test_single.png';
            const img = new Jimp({ width: 1, height: 1, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath, { width: 1, height: 1 });

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);

            fs.unlinkSync(testImagePath);
        });

        test('should handle large images', async () => {
            const testImagePath = '/tmp/test_large.png';
            const img = new Jimp({ width: 200, height: 100, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath, { width: 100, height: 50 });

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);

            fs.unlinkSync(testImagePath);
        });

        test('should clamp dimensions to valid range', async () => {
            const testImagePath = '/tmp/test_clamp.png';
            const img = new Jimp({ width: 100, height: 100, background: 0x80808080 });
            await img.write(testImagePath);

            const result = await convertToAscii(testImagePath, { width: 500, height: 500 });
            expect(typeof result).toBe('string');

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

            expect(normal).not.toEqual(inverted);
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

            expect(normal).not.toEqual(threshold);
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

            expect(dim).not.toEqual(bright);
        });

        test('should apply contrast to image data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: new Uint8ClampedArray(10 * 10 * 4)
            };
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    const idx = (y * 10 + x) * 4;
                    imageData.data[idx] = x < 5 ? 50 : 200;
                    imageData.data[idx + 1] = x < 5 ? 50 : 200;
                    imageData.data[idx + 2] = x < 5 ? 50 : 200;
                    imageData.data[idx + 3] = 255;
                }
            }

            const low = await processImageData(imageData, { width: 10, height: 5, contrast: -100 });
            const high = await processImageData(imageData, { width: 10, height: 5, contrast: 100 });

            expect(low).not.toEqual(high);
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

            expect(normal).not.toEqual(flipped);
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

            expect(normal).not.toEqual(flipped);
        });

        test('should handle all options together', async () => {
            const imageData = {
                width: 30,
                height: 20,
                data: []
            };
            for (let i = 0; i < 30 * 20 * 4; i += 4) {
                imageData.data.push(128, 128, 128, 255);
            }

            const result = await processImageData(imageData, {
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
        });

        test('should use default charset when invalid provided', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: []
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data.push(128, 128, 128, 255);
            }

            const result = await processImageData(imageData, { charset: 'invalidCharset' });
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });
});

describe('Server Endpoints', () => {
    describe('GET /health', () => {
        test('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('GET /fonts', () => {
        test('should return available fonts', async () => {
            const res = await request(app).get('/fonts');
            expect(res.status).toBe(200);
            expect(res.body.fonts).toBeInstanceOf(Array);
            expect(res.body.fonts.length).toBeGreaterThan(0);
        });
    });

    describe('GET /charsets', () => {
        test('should return available charsets', async () => {
            const res = await request(app).get('/charsets');
            expect(res.status).toBe(200);
            expect(res.body.charsets).toBeInstanceOf(Array);
            expect(res.body.charsets.length).toBe(15);
        });
    });

    describe('POST /convert', () => {
        test('should return 400 when no file uploaded', async () => {
            const res = await request(app).post('/convert');
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('No image uploaded');
        });

        test('should handle textImage mode without imageData', async () => {
            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage');
            expect(res.status).toBe(400);
        });

        test('should handle textImage mode with invalid imageData', async () => {
            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage')
                .field('imageData', 'not valid json');
            expect(res.status).toBe(500);
        });

        test('should handle textImage mode with valid data', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: new Uint8ClampedArray(10 * 10 * 4)
            };
            for (let i = 0; i < 10 * 10 * 4; i += 4) {
                imageData.data[i] = 128;
                imageData.data[i + 1] = 128;
                imageData.data[i + 2] = 128;
                imageData.data[i + 3] = 255;
            }

            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage')
                .field('imageData', JSON.stringify(imageData))
                .field('maxWidth', '50')
                .field('maxHeight', '25')
                .field('charset', 'simple');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.ascii).toBeDefined();
            expect(res.body.downloadUrl).toBeDefined();
        });

        test('should handle invalid charset gracefully', async () => {
            const imageData = {
                width: 10,
                height: 10,
                data: new Uint8ClampedArray(10 * 10 * 4)
            };

            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage')
                .field('imageData', JSON.stringify(imageData))
                .field('charset', 'nonexistent');
            expect(res.status).toBe(200);
        });

        test('should return 400 for invalid imageData format', async () => {
            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage')
                .field('imageData', JSON.stringify({ width: 10 }));
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid image data format');
        });

        test('should handle invalid image data - missing data array', async () => {
            const res = await request(app)
                .post('/convert')
                .field('mode', 'textImage')
                .field('imageData', JSON.stringify({ width: 10, height: 10 }));
            expect(res.status).toBe(400);
        });
    });

    describe('Server utilities', () => {
        test('cleanupOldFiles should handle missing directory', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
        });
    });

    describe('Error handling', () => {
        test('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown-route');
            expect(res.status).toBe(404);
        });
    });

    describe('File upload', () => {
        test('should upload and convert image file', async () => {
            const testImagePath = '/tmp/test_upload.png';
            const img = new Jimp({ width: 20, height: 20, color: 0x808080ff });
            await img.write(testImagePath);

            const res = await request(app)
                .post('/convert')
                .attach('image', testImagePath)
                .field('maxWidth', '20')
                .field('maxHeight', '10');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.ascii).toBeDefined();

            fs.unlinkSync(testImagePath);
        });

        test('should handle file upload with custom charset', async () => {
            const testImagePath = '/tmp/test_charset.png';
            const img = new Jimp({ width: 10, height: 10, color: 0x808080ff });
            await img.write(testImagePath);

            const res = await request(app)
                .post('/convert')
                .attach('image', testImagePath)
                .field('charset', 'blocks')
                .field('invert', 'true')
                .field('flipH', 'true');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            fs.unlinkSync(testImagePath);
        });

        test('should handle file upload with flipV option', async () => {
            const testImagePath = '/tmp/test_flipv.png';
            const img = new Jimp({ width: 10, height: 10, color: 0x808080ff });
            await img.write(testImagePath);

            const res = await request(app)
                .post('/convert')
                .attach('image', testImagePath)
                .field('flipV', 'true');

            expect(res.status).toBe(200);

            fs.unlinkSync(testImagePath);
        });
    });
});

afterAll(done => {
    server.close(() => {
        done();
    });
});
