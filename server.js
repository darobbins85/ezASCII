const express = require('express');
const multer = require('multer');
const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;

app.use(express.static('public'));
app.use('/output', express.static('output'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ASCII_CHARSETS = {
    simple: ' .:-=+*#%',
    detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    blocks: ' ▓▒░ ',
    minimal: ' .:-#'
};

function getAvailableFonts() {
    try {
        const fontList = execSync('fc-list : family 2>/dev/null', { encoding: 'utf8' });
        const fonts = fontList.split('\n')
            .filter(f => f.trim())
            .map(f => f.split(',')[0].trim())
            .filter(f => f.length > 0)
            .filter(f => !f.match(/[0-9a-z]+Arabic|Hebrew|Chinese|Japanese|Korean|Thai|Cyrillic|Greek|Indic/))
            .filter(f => f.length < 30)
            .sort()
            .filter((f, i, arr) => arr.indexOf(f) === i)
            .slice(0, 30);
        return fonts.length > 0 ? fonts : ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Monaco', 'Menlo', 'Consolas'];
    } catch {
        return ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Monaco', 'Menlo', 'Consolas'];
    }
}

const AVAILABLE_FONTS = getAvailableFonts();

app.get('/fonts', (req, res) => {
    res.json({ fonts: AVAILABLE_FONTS });
});

async function convertToAscii(imagePath, options = {}) {
    const { width = 200, height = 100, charset = 'detailed', invert = false, flipH = false, flipV = false } = options;
    
    const image = await Jimp.read(imagePath);
    await image.resize({ w: width, h: height });
    
    if (flipH) image.flip({ horizontal: true, vertical: false });
    if (flipV) image.flip({ horizontal: false, vertical: true });
    
    let minX = image.width, maxX = 0, minY = image.height, maxY = 0;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixel = image.getPixelColor(x, y);
            const r = (pixel >> 24) & 255;
            const g = (pixel >> 16) & 255;
            const b = (pixel >> 8) & 255;
            const brightness = Math.floor((r + g + b) / 3);
            
            if (brightness < 250) {
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
            let brightness = Math.floor((r + g + b) / 3);
            
            if (invert) {
                brightness = 255 - brightness;
            }
            
            const charIndex = Math.floor((brightness / 255) * (charCount - 1));
            const char = chars[invert ? charCount - 1 - charIndex : charIndex];
            asciiArt += char;
        }
        asciiArt += '\n';
    }
    
    return asciiArt.trimEnd();
}

async function processImageData(imageDataObj, options = {}) {
    const { width = 200, height = 100, charset = 'detailed', invert = false, flipH = false, flipV = false } = options;
    
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
    
    let minX = image.width, maxX = 0, minY = image.height, maxY = 0;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixel = image.getPixelColor(x, y);
            const r = (pixel >> 24) & 255;
            const g = (pixel >> 16) & 255;
            const b = (pixel >> 8) & 255;
            const brightness = Math.floor((r + g + b) / 3);
            
            if (brightness < 250) {
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
            let brightness = Math.floor((r + g + b) / 3);
            
            if (invert) {
                brightness = 255 - brightness;
            }
            
            const charIndex = Math.floor((brightness / 255) * (charCount - 1));
            const char = chars[invert ? charCount - 1 - charIndex : charIndex];
            asciiArt += char;
        }
        asciiArt += '\n';
    }
    
    return asciiArt.trimEnd();
}

app.post('/convert', upload.single('image'), async (req, res) => {
    const mode = req.body?.mode || 'image';
    
    if (mode === 'textImage') {
        try {
            const imageDataStr = req.body?.imageData;
            if (!imageDataStr) {
                return res.status(400).json({ error: 'No image data provided' });
            }
            
            const imageData = JSON.parse(imageDataStr);
            const width = parseInt(req.body?.maxWidth) || 200;
            const height = parseInt(req.body?.maxHeight) || 100;
            const charset = req.body?.charset || 'detailed';
            const invert = req.body?.invert === 'true';
            const flipH = req.body?.flipH === 'true';
            const flipV = req.body?.flipV === 'true';
            
            const asciiArt = await processImageData(imageData, { width, height, charset, invert, flipH, flipV });
            
            const outputFileName = `ascii_${Date.now()}.txt`;
            const outputPath = path.join(__dirname, 'output', outputFileName);
            fs.writeFileSync(outputPath, asciiArt);
            
            res.json({ 
                success: true, 
                ascii: asciiArt,
                downloadUrl: `/output/${outputFileName}`
            });
        } catch (error) {
            console.error('TEXT IMAGE ERROR:', error.message);
            res.status(500).json({ error: 'Failed to convert text: ' + error.message });
        }
        return;
    }
    
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
        const width = parseInt(req.body?.maxWidth) || 200;
        const height = parseInt(req.body?.maxHeight) || 100;
        const charset = req.body?.charset || 'detailed';
        const invert = req.body?.invert === 'true';
        const flipH = req.body?.flipH === 'true';
        const flipV = req.body?.flipV === 'true';
        
        const asciiArt = await convertToAscii(req.file.path, { width, height, charset, invert, flipH, flipV });
        
        const outputFileName = `ascii_${Date.now()}.txt`;
        const outputPath = path.join(__dirname, 'output', outputFileName);
        fs.writeFileSync(outputPath, asciiArt);
        
        fs.unlinkSync(req.file.path);
        
        res.json({ 
            success: true, 
            ascii: asciiArt,
            downloadUrl: `/output/${outputFileName}`
        });
    } catch (error) {
        console.error('CONVERSION ERROR:', error.message);
        console.error(error.stack);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to convert image: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
