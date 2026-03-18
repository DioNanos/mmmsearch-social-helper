const EXTRACT_TIMEOUT_MS = 7000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ available: true, version: chrome.runtime.getManifest().version });
    return false;
  }

  if (message?.type === 'EXTRACT_PROFILE') {
    handleExtract(message.payload || {})
      .then((profile) => sendResponse(profile ? { ok: true, profile } : { ok: false, errorCode: 'empty_profile' }))
      .catch((error) => sendResponse({ ok: false, errorCode: String(error?.message || error || 'extract_failed') }));
    return true;
  }

  return false;
});

async function handleExtract({ platform, url, handle }) {
  if (!['instagram', 'facebook'].includes(platform) || !url) return null;
  const tab = await chrome.tabs.create({ url, active: false });
  try {
    await waitForTabComplete(tab.id, EXTRACT_TIMEOUT_MS);
    await sleep(platform === 'facebook' ? 1500 : 900);
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: platform === 'instagram' ? extractInstagramProfile : extractFacebookProfile,
      args: [{ url, handle }],
    });
    if (!result) return null;
    return {
      platform,
      url,
      handle,
      sourceKind: 'browser-helper',
      source: `browser-helper:${platform}`,
      ...result,
    };
  } finally {
    try { await chrome.tabs.remove(tab.id); } catch { /* ignore */ }
  }
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('tab_timeout'));
    }, timeoutMs);

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab?.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractInstagramProfile({ url, handle }) {
  const decodeEscaped = (raw) => {
    if (!raw) return null;
    return String(raw)
      .replace(/\\n/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/\\\\/g, '\\')
      .trim();
  };
  const parseCount = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return null;
    const match = value.match(/([\d.,]+)\s*([KMB])?/i);
    if (!match) return null;
    const num = Number.parseFloat(match[1].replace(/,/g, '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (match[2] || '').toUpperCase();
    const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1;
    return Math.round(num * multiplier);
  };
  if (/accounts\/login/i.test(location.pathname)) return null;
  const html = document.documentElement.innerHTML;
  const text = document.body?.innerText || '';

  const pick = (pattern) => decodeEscaped(html.match(pattern)?.[1] || null);
  const count = (pattern) => {
    const matched = html.match(pattern)?.[1] || text.match(pattern)?.[1];
    return matched != null ? Number.parseInt(String(matched).replace(/[^\d]/g, ''), 10) || parseCount(matched) : null;
  };

  const name = pick(/"full_name":"([^"]+)"/) || document.querySelector('header h1, header h2')?.textContent?.trim() || handle;
  const bio = pick(/"biography":"([^"]*)"/) || null;
  const avatar = pick(/"profile_pic_url_hd":"([^"]+)"/) || pick(/"profile_pic_url":"([^"]+)"/) || document.querySelector('header img')?.src || null;
  const externalUrl = pick(/"external_url":"([^"]+)"/) || null;
  const followers = count(/"edge_followed_by":\{"count":(\d+)/) || count(/([\d.,]+)\s+followers/i);
  const following = count(/"edge_follow":\{"count":(\d+)/) || count(/([\d.,]+)\s+following/i);
  const posts = count(/"edge_owner_to_timeline_media":\{"count":(\d+)/) || count(/([\d.,]+)\s+posts/i);

  if (!name && !bio && !avatar && !followers && !posts) return null;
  return { name, bio, avatar, externalUrl, followers, following, posts };
}

function extractFacebookProfile({ url, handle }) {
  const parseCount = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return null;
    const match = value.match(/([\d.,]+)\s*([KMB])?/i);
    if (!match) return null;
    const num = Number.parseFloat(match[1].replace(/,/g, '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (match[2] || '').toUpperCase();
    const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1;
    return Math.round(num * multiplier);
  };
  if (/login/i.test(location.pathname)) return null;
  const title = document.querySelector('meta[property="og:title"]')?.content
    || document.querySelector('title')?.textContent
    || handle;
  const avatar = document.querySelector('meta[property="og:image"]')?.content
    || document.querySelector('img')?.src
    || null;
  const metaDescription = document.querySelector('meta[property="og:description"]')?.content
    || document.querySelector('meta[name="description"]')?.content
    || null;
  const bodyText = document.body?.innerText || '';
  const website = Array.from(document.querySelectorAll('a[href]'))
    .map((a) => a.href)
    .find((href) => /^https?:\/\//.test(href) && !/facebook\.com|l\.facebook\.com/i.test(href))
    || null;
  const followers = parseCount(bodyText.match(/([\d.,KMB]+)\s+followers/i)?.[1]);
  const likes = parseCount(bodyText.match(/([\d.,KMB]+)\s+likes/i)?.[1]);
  const bio = metaDescription && metaDescription !== title ? metaDescription.trim() : null;

  if (!title && !bio && !avatar && !followers && !website) return null;
  return {
    name: String(title || '').replace(/\s*\|\s*Facebook.*$/i, '').trim() || handle,
    bio,
    avatar,
    externalUrl: website,
    followers: followers || likes || null,
  };
}
