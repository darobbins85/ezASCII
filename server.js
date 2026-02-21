require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const rateLimit = require('express-rate-limit');
const {
    convertToAscii,
    processImageData,
    ASCII_CHARSETS,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MAX_WIDTH,
    MAX_HEIGHT
} = require('./asciiConverter');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
        files: 1
    },
    fileFilter (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, BMP, and WebP are allowed.'));
        }
    }
});

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);
app.use(express.static('public'));
app.use('/output', express.static('output'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

function getSystemFonts() {
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
        return fonts.length > 0 ? fonts : getDefaultFonts();
    } catch {
        return getDefaultFonts();
    }
}

function getDefaultFonts() {
    return ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Monaco', 'Menlo', 'Consolas'];
}

const AVAILABLE_FONTS = getSystemFonts();

function cleanupOldFiles(directory, maxAgeMs) {
    const maxAge = maxAgeMs || parseInt(process.env.FILE_MAX_AGE_MS) || 60 * 60 * 1000;
    try {
        const files = fs.readdirSync(directory);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(directory, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                }
            } catch {
            }
        });
    } catch {
    }
}

const cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL_MS) || 15 * 60 * 1000;
setInterval(() => {
    cleanupOldFiles('output');
    cleanupOldFiles('uploads');
}, cleanupInterval);

app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'An error occurred. Please try again.' });
});

app.get('/fonts', (req, res) => {
    res.json({ fonts: AVAILABLE_FONTS });
});

app.get('/charsets', (req, res) => {
    res.json({ charsets: Object.keys(ASCII_CHARSETS) });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.post('/convert', upload.single('image'), async (req, res) => {
    const mode = req.body?.mode || 'image';

    if (mode === 'textImage') {
        try {
            const imageDataStr = req.body?.imageData;
            if (!imageDataStr) {
                return res.status(400).json({ error: 'No image data provided' });
            }

            const imageData = JSON.parse(imageDataStr);
            if (!imageData || !imageData.width || !imageData.height || !imageData.data) {
                return res.status(400).json({ error: 'Invalid image data format' });
            }

            const asciiArt = await processImageData(imageData, {
                width: Math.min(MAX_WIDTH, Math.max(10, parseInt(req.body?.maxWidth) || DEFAULT_WIDTH)),
                height: Math.min(MAX_HEIGHT, Math.max(10, parseInt(req.body?.maxHeight) || DEFAULT_HEIGHT)),
                charset: req.body?.charset || 'detailed',
                invert: req.body?.invert === 'true',
                threshold: req.body?.threshold === 'true',
                brightness: req.body?.brightness || '0',
                contrast: req.body?.contrast || '0',
                flipH: req.body?.flipH === 'true',
                flipV: req.body?.flipV === 'true'
            });

            const outputFileName = `ascii_${Date.now()}.txt`;
            const outputPath = path.join(__dirname, 'output', outputFileName);
            fs.writeFileSync(outputPath, asciiArt);

            res.json({
                success: true,
                ascii: asciiArt,
                downloadUrl: `/output/${outputFileName}`
            });
        } catch (error) {
            console.error(`[ERROR] TEXT IMAGE: ${error.message}`);
            res.status(500).json({ error: 'Failed to convert text. Please try again.' });
        }
        return;
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
        const asciiArt = await convertToAscii(req.file.path, {
            width: Math.min(MAX_WIDTH, Math.max(10, parseInt(req.body?.maxWidth) || DEFAULT_WIDTH)),
            height: Math.min(MAX_HEIGHT, Math.max(10, parseInt(req.body?.maxHeight) || DEFAULT_HEIGHT)),
            charset: req.body?.charset || 'detailed',
            invert: req.body?.invert === 'true',
            threshold: req.body?.threshold === 'true',
            brightness: req.body?.brightness || '0',
            contrast: req.body?.contrast || '0',
            flipH: req.body?.flipH === 'true',
            flipV: req.body?.flipV === 'true'
        });

        const outputFileName = `ascii_${Date.now()}.txt`;
        const outputPath = path.join(__dirname, 'output', outputFileName);
        fs.writeFileSync(outputPath, asciiArt);

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            ascii: asciiArt,
            downloadUrl: `/output/${outputFileName}`
        });
    } catch (error) {
        console.error(`[ERROR] CONVERSION: ${error.message}`);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to convert image. Please try again.' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
