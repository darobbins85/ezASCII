# AGENTS.md - ASCII Art Generator

## Project Overview

- **Project Name**: ASCII Art Generator
- **Type**: Node.js/Express web application
- **Core Functionality**: Converts images (uploaded or text-to-image) to ASCII art
- **Main Entry Point**: `server.js`
- **Frontend**: Vanilla JavaScript (`public/script.js`)

## Tech Stack

- **Runtime**: Node.js (CommonJS modules)
- **Server**: Express.js
- **Image Processing**: Jimp
- **File Uploads**: Multer
- **Testing**: Jest + supertest

---

## Build, Lint, and Test Commands

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm test -- tests/ascii.test.js

# Run a specific test by name (use --testNamePattern)
npm test -- --testNamePattern="convertToAscii"
```

### Running the Application

```bash
# Start the server (runs on port 3000)
npm start

# Or manually
node server.js
```

### Notes

- There is no ESLint, Prettier, or other linting tools configured
- Jest configuration is in `package.json` under the `jest` key
- Test files are located in `tests/` directory with `.test.js` suffix

---

## Code Style Guidelines

### General

- **Indentation**: 4 spaces
- **Line Endings**: Unix (LF)
- **Semicolons**: Use semicolons at statement ends (follow existing code in `server.js`)
- **Strings**: Single quotes preferred for strings, double quotes for strings containing single quotes

### Naming Conventions

- **Variables/Functions**: camelCase (e.g., `convertToAscii`, `asciiArt`)
- **Constants**: UPPER_SNAKE_CASE for configuration constants (e.g., `ASCII_CHARSETS`, `PORT`)
- **Files**: kebab-case (e.g., `ascii.test.js`)
- **Object Keys**: camelCase for objects, UPPER_SNAKE_CASE for enum-like constants

### Functions

- Use `async/await` for asynchronous operations
- Prefer named functions over anonymous functions for route handlers
- Use descriptive parameter names; destructure objects in parameters when appropriate

### Error Handling

- Always wrap async route handlers in try/catch blocks
- Return appropriate HTTP status codes (400 for bad input, 500 for server errors)
- Include error messages in responses: `res.status(500).json({ error: 'Failed to convert image: ' + error.message })`
- Log errors to console with context: `console.error('CONVERSION ERROR:', error.message)`

### Imports

- Place external imports before relative imports
- Group imports: Node built-ins → npm packages → relative imports
- Example:
  ```javascript
  const express = require('express');
  const multer = require('multer');
  const { Jimp, rgbaToInt } = require('jimp');
  const path = require('path');
  const fs = require('fs');
  ```

### Types

- This is a plain JavaScript project (no TypeScript)
- Use JSDoc comments for complex function signatures if needed
- Document expected types in function parameter defaults

### Routes and Express

- Define routes with explicit HTTP methods (`app.get`, `app.post`)
- Use middleware: `express.static('public')` for static files
- Parse JSON body: `app.use(express.json())`
- Multer for file uploads: `upload.single('image')`

### Testing

- Use `describe` blocks to group related tests
- Use descriptive test names: `test('should apply invert option', ...)`
- Clean up temporary test files in tests
- Use `supertest` for HTTP endpoint testing if needed

---

## Project Structure

```
asciiArtGenerator/
├── server.js              # Main Express server
├── public/
│   ├── index.html        # Frontend HTML
│   ├── script.js         # Frontend JavaScript
│   └── style.css         # Styles
├── tests/
│   └── ascii.test.js     # Jest tests
├── output/               # Generated ASCII art files
├── uploads/              # Temporary uploaded images
├── coverage/             # Test coverage reports
├── package.json          # Dependencies and scripts
└── AGENTS.md            # This file
```

---

## Important Notes for Agents

1. **Code Duplication**: The test file (`tests/ascii.test.js`) currently duplicates the `convertToAscii` and `processImageData` functions from `server.js`. Consider refactoring to share these functions (e.g., move to a shared module).

2. **Image Cleanup**: Uploaded images are cleaned up after conversion (`fs.unlinkSync(req.file.path)`). Ensure this is maintained.

3. **Error Messages**: Always provide meaningful error messages that help with debugging but don't expose sensitive information.

4. **Font Detection**: The `getAvailableFonts()` function uses `fc-list` on Linux. This may not work on other platforms.

5. **Output Directory**: The `output/` directory stores generated ASCII art files. Consider adding cleanup for old files.

---

## Common Tasks

### Adding a New Charset

Edit `ASCII_CHARSETS` object in `server.js`:
```javascript
const ASCII_CHARSETS = {
    // ... existing charsets
    newCharset: ' your characters here ',
};
```

### Adding a New Route

Add to `server.js` after existing routes:
```javascript
app.get('/new-endpoint', async (req, res) => {
    try {
        // implementation
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('ENDPOINT ERROR:', error.message);
        res.status(500).json({ error: 'Failed: ' + error.message });
    }
});
```

### Adding a Test

Add to `tests/ascii.test.js` inside appropriate `describe` block:
```javascript
test('should describe expected behavior', async () => {
    const result = await functionUnderTest(input);
    expect(result).toBe(expectedValue);
});
```
