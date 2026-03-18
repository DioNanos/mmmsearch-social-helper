# mmmsearch-social-helper

Chromium extension for `mmmsearch` that enriches problematic social profile scans using the local browser session.

Current V1 scope:
- Instagram
- Facebook
- Chrome / Brave / Edge / Chromium-compatible browsers

## What it does

When `mmmbuto.com` detects an Instagram or Facebook profile, this extension can:
- open the target profile in a background tab
- read public profile fields using the browser's local session
- send only extracted profile data back to `mmmsearch`

It does **not** send cookies or account credentials to the server.

## Files

- `manifest.json`
- `background.js`
- `bridge.js`

## Install (unpacked)

### Brave / Chrome / Edge

1. Open `brave://extensions` or `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder

## Supported sites

The extension is wired for:
- `https://mmmbuto.com/*`
- `https://www.mmmbuto.com/*`
- `http://localhost/*`
- `http://127.0.0.1/*`

It can inspect:
- `https://www.instagram.com/*`
- `https://www.facebook.com/*`
- `https://m.facebook.com/*`

## Privacy model

- profile extraction happens in the local browser
- cookies stay inside the browser
- `mmmsearch` receives only extracted profile fields
- the helper is request-scoped and not a credential proxy

## Status

V1 is repository-ready and works with the current `mmmsearch` profiler bridge.
Manual validation in a real browser session is still recommended.

## Related project

Main app:
- https://mmmbuto.com
- https://github.com/DioNanos/MmmSearch
