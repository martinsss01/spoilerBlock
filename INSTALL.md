# SpoilerBlock Extension - Installation & Development Guide

## Quick Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `spoilerBlock` folder containing `manifest.json`
   - The extension should appear in your extensions list

3. **Verify Installation**
   - Look for the SpoilerBlock icon in your Chrome toolbar
   - Click it to open the settings popup

### Method 2: Package and Install

1. **Package Extension**
   - In `chrome://extensions/` with Developer mode enabled
   - Click "Pack extension"
   - Select the extension folder
   - This creates a `.crx` file

2. **Install Package**
   - Drag the `.crx` file to the Chrome extensions page
   - Click "Add extension" when prompted

## First-Time Setup

1. **Open Extension Popup**
   - Click the SpoilerBlock icon in your toolbar
   - The settings popup should appear

2. **Add Movies to Watchlist**
   - Type movie/show names in the input field
   - Click "Add to List" or press Enter
   - Examples: "Avengers: Endgame", "Game of Thrones", "The Matrix"

3. **Configure Settings**
   - Toggle "Enable Spoiler Detection" if needed
   - Choose sensitivity level (Medium recommended)
   - Settings are saved automatically

## Testing the Extension

### Test on Sample Page
1. Open `test.html` in Chrome
2. The extension should automatically detect and censor spoiler comments
3. Try revealing censored content by clicking "Click to reveal"

### Test on Instagram
1. Go to Instagram.com
2. Navigate to posts with comments
3. Add relevant movies to your watchlist
4. Check if spoilers are detected and censored

## Development Workflow

### Making Changes
1. Edit the extension files (`content.js`, `popup.js`, etc.)
2. Go to `chrome://extensions/`
3. Click the refresh icon on the SpoilerBlock extension card
4. Test your changes

### Debugging
1. **Content Script Issues**
   - Open Developer Tools (F12) on Instagram
   - Check Console tab for "SpoilerBlock:" messages
   - Look for JavaScript errors

2. **Popup Issues**
   - Right-click the extension icon
   - Select "Inspect popup"
   - Debug in the popup's Developer Tools

3. **Storage Issues**
   - Go to `chrome://extensions/`
   - Click "Details" on SpoilerBlock
   - Check "Allow in incognito" if testing there

### Common Development Issues

**Extension not loading:**
- Check `manifest.json` for syntax errors
- Ensure all referenced files exist
- Check Chrome Developer Tools for error messages

**Content script not running:**
- Verify the site matches the `content_scripts.matches` pattern
- Check if the content script has permission to access the site
- Ensure the script is loading in Developer Tools → Sources

**Popup not working:**
- Check popup HTML for syntax errors
- Verify all JavaScript files are loaded correctly
- Check popup permissions in manifest

## File Structure Overview

```
spoilerBlock/
├── manifest.json          # Extension configuration
├── popup.html             # Settings UI
├── popup.js              # Settings functionality  
├── content.js            # Main spoiler detection
├── content.css           # Spoiler overlay styles
├── test.html             # Local testing page
├── icons/                # Extension icons
├── .gitignore            # Git ignore rules
└── README.md             # Main documentation
```

## Advanced Configuration

### Customizing Detection Patterns
Edit `content.js` to modify:
- Spoiler keywords in `getSpoilerKeywords()`
- Detection patterns in `detectSpoiler()`
- Confidence calculation in `calculateConfidence()`

### Styling Spoiler Overlays
Edit `content.css` to customize:
- Overlay appearance
- Animation effects
- Mobile responsiveness
- Accessibility features

### Adding New Features
1. Update `manifest.json` if new permissions needed
2. Modify content script for new detection logic
3. Update popup for new user settings
4. Test thoroughly across different scenarios

## Troubleshooting

### Extension Not Working
1. Check if extension is enabled in `chrome://extensions/`
2. Verify you're on a supported site (Instagram)
3. Check browser console for errors
4. Try refreshing the extension

### No Spoilers Detected
1. Add relevant movies to your watchlist
2. Check sensitivity level (try "High")
3. Verify spoiler detection is enabled
4. Test with known spoiler text

### Too Many False Positives  
1. Lower sensitivity to "Low"
2. Remove broad movie titles from watchlist
3. Be more specific with movie names

## Contributing

1. Fork the repository
2. Make your changes following the existing code style
3. Test thoroughly with various spoiler scenarios
4. Submit a pull request with a clear description

## Performance Notes

- Extension uses minimal CPU when no spoilers are detected
- Memory usage scales with number of text elements on page
- Observer patterns ensure efficient real-time monitoring
- Local processing means no network overhead

---

**Happy spoiler-free browsing! 🎬✨**