# ASCII Art Generator

A web application that converts images (uploaded or text) to ASCII art.

## Features

- **Image Upload**: Upload any image file to convert it to ASCII art
- **Text to ASCII**: Enter text and render it as ASCII art with customizable fonts
- **Multiple Charsets**: Choose from 15 different character sets (simple, detailed, blocks, braille, etc.)
- **Image Adjustments**:
  - Invert colors
  - Threshold/binarization
  - Brightness adjustment
  - Contrast adjustment
  - Horizontal/vertical flip
- **Export Options**: Copy to clipboard or download as text file

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

## Available Charsets

| Name | Description |
|------|-------------|
| `simple` | Basic gradient: `. :-=+*#%` |
| `detailed` | Rich character set for high detail |
| `blocks` | Block characters: `▓▒░` |
| `minimal` | Minimal: `. :-#` |
| `binary` | Solid blocks: `█` |
| `starburst` | Star pattern: `.*+-oO#%@` |
| `brackets` | Bracket characters |
| `lines` | Line characters |
| `hash` | Hash only |
| `slash` | Slash characters |
| `dot` | Dots only |
| `at` | At signs |
| `box` | Box-drawing characters |
| `geometric` | Geometric shapes |
| `braille` | Braille patterns |

## API Endpoints

### POST /convert

Convert an image to ASCII art.

**Form Data:**
- `image` (file): Image file to convert
- `maxWidth` (number): Output width (default: 200)
- `maxHeight` (number): Output height (default: 100)
- `charset` (string): Character set name (default: "detailed")
- `invert` (boolean): Invert brightness
- `threshold` (boolean): Apply threshold/binarization
- `brightness` (number): Brightness adjustment (-255 to 255)
- `contrast` (number): Contrast adjustment (-255 to 255)
- `flipH` (boolean): Flip horizontally
- `flipV` (boolean): Flip vertically
- `mode` (string): "image" or "textImage"
- `imageData` (string): JSON string for textImage mode

**Response:**
```json
{
  "success": true,
  "ascii": "ASCII art string...",
  "downloadUrl": "/output/ascii_1234567890.txt"
}
```

### GET /fonts

Get available system fonts.

**Response:**
```json
{
  "fonts": ["Arial", "Courier New", ...]
}
```

## Tech Stack

- Node.js + Express
- Jimp (image processing)
- Multer (file uploads)
- Vanilla JavaScript frontend
- Jest (testing)

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
asciiArtGenerator/
├── server.js          # Express server
├── public/
│   ├── index.html    # Main page
│   ├── script.js     # Frontend logic
│   └── style.css     # Styles
├── tests/
│   └── ascii.test.js # Tests
├── output/           # Generated ASCII files
├── uploads/          # Temporary uploads
└── package.json
```
