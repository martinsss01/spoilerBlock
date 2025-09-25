# 🚫 Spoiler Block

An AI-powered Chrome extension that automatically detects and censors spoilers in Instagram comments and posts to protect your viewing experience.

## Features

- **Smart Spoiler Detection**: Uses advanced pattern recognition to identify potential spoilers
- **Instagram Integration**: Seamlessly works with Instagram comments and posts
- **Customizable Movie List**: Add movies and TV shows you want to protect yourself from
- **Adjustable Sensitivity**: Choose between low, medium, and high detection sensitivity
- **One-Click Reveal**: Easily reveal censored content when you're ready
- **Real-time Monitoring**: Automatically processes new content as it loads
- **Privacy-First**: All processing happens locally in your browser

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Spoiler Block"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

## Usage

### Setup
1. Click the Spoiler Block icon in your Chrome toolbar
2. Enable spoiler detection using the toggle switch
3. Add movies or TV shows to your watchlist
4. Select your preferred sensitivity level

### On Instagram
1. Visit Instagram in your browser
2. The extension will automatically scan comments and posts
3. When spoilers are detected, they'll be blurred with a warning overlay
4. Click "Click to reveal" to see the original content

### Sensitivity Levels
- **Low**: Only detects obvious spoilers (deaths, endings, major plot points)
- **Medium**: Balanced detection including plot reveals and twists
- **High**: Very cautious - detects any potentially revealing content

## How It Works

The extension uses a combination of techniques to detect spoilers:

1. **Movie/Show Recognition**: Identifies when your watchlisted content is mentioned
2. **Keyword Analysis**: Looks for spoiler-related terms and patterns
3. **Context Analysis**: Evaluates the context around potential spoilers
4. **Pattern Matching**: Uses regex patterns to catch common spoiler formats

### Detection Patterns
- Direct spoiler keywords (dies, killed, ending, etc.)
- Episode/season references (S03E05, season 3 episode 5)
- Spoiler warnings ("spoiler alert", "don't read if...")
- Plot-related terms (twist, reveals, turns out)

## AI Integration Ready

This extension is designed with AI integration in mind:

- **Modular Architecture**: Easy to plug in AI services
- **API-Ready Structure**: Built to integrate with spoiler detection APIs
- **Configurable Models**: Support for different AI models and confidence thresholds
- **Training Data Ready**: Structured to work with machine learning datasets

## Technical Details

### Architecture
- **Manifest V3**: Built with the latest Chrome extension standards
- **Content Script**: Monitors Instagram DOM for text content
- **Popup Interface**: User-friendly settings management
- **Chrome Storage API**: Persistent settings storage
- **Mutation Observer**: Real-time content monitoring

### File Structure
```
spoilerBlock/
├── manifest.json          # Extension configuration
├── popup.html             # Settings interface
├── popup.js              # Settings functionality
├── content.js            # Main spoiler detection logic
├── content.css           # Styling for spoiler overlays
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Privacy & Security

- **No Data Collection**: Your watchlist and settings stay on your device
- **Local Processing**: All spoiler detection happens in your browser
- **No External Requests**: No data is sent to external servers
- **Open Source**: Full transparency in how your data is handled

## Development

### Prerequisites
- Chrome/Chromium browser
- Basic understanding of JavaScript and Chrome extensions

### Local Development
1. Clone the repository
2. Load the extension in developer mode
3. Make changes to the code
4. Refresh the extension in Chrome to test changes

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Instagram
5. Submit a pull request

## Future Enhancements

- **AI Integration**: Machine learning-based spoiler detection
- **Multi-Platform Support**: Extend to Twitter, Reddit, Facebook
- **Custom Keywords**: User-defined spoiler keywords
- **Smart Notifications**: Alert when spoilers are detected
- **Cloud Sync**: Sync settings across devices
- **Community Database**: Shared spoiler patterns

## Troubleshooting

### Common Issues

**Extension not working on Instagram**
- Refresh the Instagram page
- Check if the extension is enabled
- Verify Instagram is in the allowed sites

**Spoilers not being detected**
- Check your movie list includes the relevant titles
- Try increasing sensitivity level
- Ensure detection is enabled

**Too many false positives**
- Lower the sensitivity level
- Remove overly broad movie titles
- Update your movie list to be more specific

### Debug Mode
Enable developer mode in Chrome extensions to see console logs:
1. Open Developer Tools (F12)
2. Look for "SpoilerBlock:" messages in the console
3. Report any errors in GitHub issues

## License

This project is open source and available under the MIT License.

## Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README for common questions
- **Community**: Join discussions in GitHub Discussions

---

**Protect your entertainment experience! No more accidental spoilers while browsing Instagram.**