# mmmsearch-social-helper

Browser helper for `mmmsearch` that improves `Profile Scan` on difficult social platforms by using the local browser session.

Current source of truth:
- Repo: https://github.com/DioNanos/mmmsearch-social-helper
- Latest release: https://github.com/DioNanos/mmmsearch-social-helper/releases/latest

## Status

Current packaging channels:
- Chrome / Brave / Edge desktop: beta package available now
- Firefox desktop: developer package available now
- Firefox Android: runtime target planned, simple install pending AMO publication
- Safari iPhone / iPad / macOS: planned, requires Apple wrapper app

Supported platforms in the helper runtime today:
- Instagram
- Facebook

## Privacy model

The helper:
- uses your local browser session
- does not send cookies or credentials to `mmmsearch`
- sends only extracted profile fields back to the site
- works request-by-request, not as a remote account proxy

Typical extracted fields:
- name
- bio
- avatar
- followers / following / posts
- external link / website

## Install paths

### Chrome / Brave / Edge desktop
Fast beta path:
1. Download `mmmsearch-social-helper-chrome.zip` from the latest release
2. Extract the zip
3. Open `chrome://extensions` or `brave://extensions`
4. Enable `Developer mode`
5. Click `Load unpacked`
6. Select the extracted folder

### Firefox desktop
Current state:
- `mmmsearch-social-helper-firefox.xpi` is published as a developer package
- simple public install still needs AMO publication/signing

### Firefox Android
Target behavior:
- real mobile runtime on device
- public install path blocked until AMO channel is live

### Safari iPhone / iPad / macOS
Target behavior:
- Safari Web Extension distributed inside a wrapper app
- current repo does not yet ship the Apple app bundle

## Mobile reality

- Chrome mobile: use the helper page as an install/onboarding surface, but the extension does not run locally in Chrome mobile
- Firefox Android: intended real mobile target once AMO is ready
- Safari iOS: intended real mobile target only after the Apple wrapper app exists

## Branding

The helper brand derives from the `mmmsearch` site icon.
Source assets are taken from:
- `/opt/mmmsearch/frontend/public/icon.svg`
- `/opt/mmmsearch/frontend/public/icon-512.png`

## Build

```bash
npm run build
```

Build output:
- `dist/mmmsearch-social-helper-chrome.zip`
- `dist/mmmsearch-social-helper-firefox.xpi`
- versioned copies for the current tag version
