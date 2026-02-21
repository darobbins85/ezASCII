# ASCII Art Generator

A client-side web application that converts images and text to ASCII art. Runs entirely in the browser - no server required!

## Features

- **Image to ASCII** - Upload any image and convert it to ASCII art
- **Text to ASCII** - Type text and render it as ASCII art with customizable fonts
- **15 Character Sets** - Choose from simple, detailed, blocks, braille, and more
- **Adjustments** - Invert, threshold, brightness, contrast, flip
- **Export** - Copy to clipboard or download as text file
- **100% Client-Side** - All processing happens in your browser

## Quick Start (Local)

```bash
# Clone or download the project
cd asciiArtGenerator

# Start local server (optional - can also open index.html directly)
npx serve .

# Or just open index.html in your browser
```

## Deploy to GitHub Pages (Free Forever)

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Create a new repository (e.g., `ascii-art-generator`)
3. Upload all files from this project

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
4. Click **Save**

### Step 3: Access Your Site

Your site will be live at: `https://yourusername.github.io/ascii-art-generator/`

## How It Works

The application uses:
- **HTML5 Canvas API** - For image processing
- **JavaScript** - For ASCII conversion algorithm
- **CSS** - For styling

No server required! All conversion happens in the user's browser.

## Browser Support

Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Donation

Enjoying the tool? Consider donating!
- PayPal: [paypal.me/darobbins85](https://paypal.me/darobbins85)

## Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS3
- (Optional) Express.js for local development

## Files

```
├── public/
│   ├── index.html      # Main page
│   ├── script.js       # UI logic
│   ├── asciiConverter.js  # Conversion algorithm
│   ├── style.css      # Styles
│   ├── terms.html     # Terms of service
│   ├── privacy.html   # Privacy policy
│   └── contact.html   # Contact page
├── server.js          # Local dev server (optional)
├── package.json       # Dependencies
└── README.md          # This file
```

## License

ISC
