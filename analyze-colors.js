const { Jimp, rgbaToInt } = require('jimp');

async function analyzeColors() {
    const jimp = await Jimp.read('./public/ramen.png');
    const width = jimp.width;
    const height = jimp.height;
    const colorCounts = {};
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = jimp.getPixelColor(x, y);
            const r = (pixel >> 24) & 255;
            const g = (pixel >> 16) & 255;
            const b = (pixel >> 8) & 255;
            const a = pixel & 255;
            if (a < 128) continue;
            const key = Math.round(r/32)*32 + ',' + Math.round(g/32)*32 + ',' + Math.round(b/32)*32;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
    }
    
    const sorted = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
    console.log('Top 10 colors (rounded to 32):');
    sorted.forEach(([color, count]) => {
        const [r,g,b] = color.split(',').map(Number);
        console.log(`rgb(${r}, ${g}, ${b}) - ${count} pixels`);
    });
}

analyzeColors();
