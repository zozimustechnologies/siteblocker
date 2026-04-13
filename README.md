# Site Blocker Extension

<p align="center">
  <img src="store-assets/icon-300x300.png" alt="Site Blocker Icon" width="128" height="128">
</p>

<p align="center">
  <strong>Block distracting websites and boost your productivity</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#support">Support</a>
</p>

<p align="center">
  <a href="https://wise.com/pay/business/sandeepchadda?utm_source=open_link">
    <img src="https://img.shields.io/badge/Donate-Wise-00B9FF?style=for-the-badge&logo=wise" alt="Donate via Wise">
  </a>
</p>

---

## Features

- 🛡️ **Block Up to 100 Websites** — Add domains to your personal blocklist
- 🔄 **Individual Toggle Controls** — Enable/disable blocking per site without removing it
- ⚡ **Master Switch** — Quickly turn all blocking on/off with one click
- 🐕 **Fun Blocked Page** — Blocked sites show a playful animated dog licking the screen
- 🎯 **Side Panel UI** — Modern, clean interface accessible from the Edge sidebar
- 🌐 **Subdomain Support** — Blocking `facebook.com` also blocks `m.facebook.com`, `www.facebook.com`, etc.
- 🔒 **Privacy First** — All data stays local, nothing sent to external servers
- 💜 **Free Forever** — No subscriptions, no premium features locked away

## Screenshots

### Side Panel Interface
![Main Panel](store-assets/screenshot-1-overview.png)

### Fun Blocked Page with Animated Dog
![Blocked Page](store-assets/screenshot-2-add-sites.png)

### Feature Overview
![Features](store-assets/screenshot-3-toggles.png)

## Installation

### From Edge Add-ons Store (Recommended)
1. Visit the [Site Blocker page on Edge Add-ons](https://microsoftedge.microsoft.com/addons/search?developer=Zozimus%20Technologies)
2. Click **Get** to install
3. Pin the extension to your toolbar for easy access

## Usage

### Adding Sites to Block

1. Click the extension icon in your Edge toolbar
2. The side panel opens with the Site Blocker interface
3. Enter a URL (e.g., `facebook.com`, `x.com`, `reddit.com`)
4. Click **+ Add** or press Enter
5. The site is immediately blocked!

### Managing Blocked Sites

| Action | How to |
|--------|--------|
| **Toggle individual sites** | Use the switch next to each domain to temporarily disable/enable blocking |
| **Remove a site** | Click the × button to remove it from your list |
| **Master toggle** | Use the "Blocking ON/OFF" switch at the top to disable all blocking at once (your list is preserved) |

### What Happens When You Visit a Blocked Site

When you try to visit a blocked site, you'll see a fun page with:
- 🚫 A clear "Site Blocked!" message
- 🐕 A friendly animated dog licking the screen
- ⬅️ A "Go Back" button to return to your previous page
- 🎯 Motivational message about staying productive

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save your blocklist locally in your browser |
| `sidePanel` | Display the side panel UI |
| `declarativeNetRequest` | Block/redirect websites at the network level |
| `<all_urls>` | Apply blocking rules to any website you choose to block |

## How It Works

The extension uses Chrome's `declarativeNetRequest` API (Manifest V3) to efficiently block websites at the network level:

1. **Adding a domain**: When you add a domain like `facebook.com`, a blocking rule is created with the pattern `||facebook.com/`
2. **Subdomain matching**: This pattern automatically matches the domain and ALL its subdomains (m.facebook.com, www.facebook.com, etc.)
3. **Redirect action**: Matched requests are redirected to the fun `blocked.html` page instead of being silently blocked
4. **Instant sync**: Rules are applied instantly — no browser restart needed

### Technical Details

- **Rule limit**: Up to 5,000 dynamic rules (way more than the 100 site limit)
- **Storage**: Uses `chrome.storage.local` for persisting your blocklist
- **No background polling**: Rules are declarative and handled by the browser itself

## Privacy & Security

🔒 **Your data stays completely local**

| What we DON'T do | What we DO |
|------------------|------------|
| ❌ No external servers | ✅ Everything runs locally |
| ❌ No analytics or tracking | ✅ Open source code |
| ❌ No data collection | ✅ Your blocklist stays in your browser |
| ❌ No account required | ✅ Works offline |

**Open Source**: Inspect the code yourself — all JavaScript is unminified and readable.

## Troubleshooting

### Sites not being blocked
- ✅ Make sure the **master toggle is ON** (shows green "ON" status)
- ✅ Check that the **individual site toggle** is enabled (purple, not gray)
- ✅ Try refreshing the page after adding a site
- ✅ Make sure you entered just the domain (e.g., `facebook.com` not `https://www.facebook.com/page`)

### Extension not loading
- ✅ Ensure **Developer mode** is enabled in `edge://extensions/`
- ✅ Try clicking **Reload** on the extension card
- ✅ Check for errors by clicking "Inspect views: service worker"

### Side panel not opening
- ✅ Click the extension icon in the toolbar (not the puzzle piece menu)
- ✅ If pinned, make sure you're clicking the Site Blocker icon (shield with stop sign)

### Blocked page not showing
- ✅ The blocked page only shows for `main_frame` requests (page navigations)
- ✅ Embedded content (images, scripts) from blocked domains is just blocked silently

## Development

### Project Structure

```
website-blocker-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for rule management
├── sidepanel.html         # Side panel UI structure
├── sidepanel.js           # Side panel logic
├── sidepanel.css          # Side panel styles
├── blocked.html           # Fun blocked page with animated dog
├── blocked.js             # Blocked page script (CSP compliant)
├── icons/
│   ├── icon16.png         # Toolbar icon (16×16)
│   ├── icon48.png         # Extension management icon (48×48)
│   └── icon128.png        # Store listing icon (128×128)
├── store-assets/
│   ├── generate-png-icons.html  # Tool to generate PNG icons
│   ├── screenshot-1-main-panel.html
│   ├── screenshot-2-blocked-page.html
│   ├── screenshot-3-features.html
│   └── promo-tile-440x280.html
└── README.md
```

### Building for Production

1. Ensure all icons are in PNG format (use `store-assets/icon-generator.html`)
2. Update version in `manifest.json`
3. Create ZIP file excluding development files:

```bash
# PowerShell
Compress-Archive -Path manifest.json, background.js, sidepanel.html, sidepanel.js, sidepanel.css, blocked.html, icons -DestinationPath site-blocker-extension.zip
```

### API Reference

The extension exposes these message actions via `chrome.runtime.sendMessage`:

| Action | Parameters | Description |
|--------|------------|-------------|
| `getSites` | — | Get all blocked sites and master toggle state |
| `addSite` | `domain` | Add a new site to the blocklist |
| `removeSite` | `domain` | Remove a site from the blocklist |
| `toggleSite` | `domain`, `enabled` | Toggle a specific site's blocking |
| `toggleMaster` | `enabled` | Toggle master blocking on/off |
| `syncRules` | — | Force sync blocking rules with storage |

## Support Development

If you find this extension useful, consider supporting its development:

<a href="https://wise.com/pay/r/wC7Us-4r3knkCCY">
  <img src="https://img.shields.io/badge/Donate-Wise-00B9FF?style=for-the-badge&logo=wise" alt="Donate via Wise">
</a>

## Version History

### v1.0.0 (Current)
- Initial release
- Block up to 100 websites
- Individual and master toggle controls
- Fun animated dog blocked page
- Side panel UI
- Subdomain blocking support
- Privacy-first design

## License

MIT License — Feel free to modify and distribute.

## Credits

- **Developer**: Zozimus Technologies
- **Icon Design**: Shield with stop sign gradient

---

<p align="center">
  Made with ❤️ for productivity enthusiasts
</p>

<p align="center">
  © Zozimus Technologies
</p>
