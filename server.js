const express = require('express');
const multer = require('multer');
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

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

async function convertToAscii(imagePath, options = {}) {
    const { width = 200, height = 100, charset = 'detailed', invert = false, flipH = false, flipV = false } = options;
    
    const image = await Jimp.read(imagePath);
    await image.resize({ w: width, h: height });
    
    if (flipH) image.flip({ horizontal: true, vertical: false });
    if (flipV) image.flip({ horizontal: false, vertical: true });
    
    const chars = ASCII_CHARSETS[charset] || ASCII_CHARSETS.detailed;
    const charCount = chars.length;
    
    let asciiArt = '';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
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
    
    return asciiArt;
}

app.post('/convert', upload.single('image'), async (req, res) => {
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
