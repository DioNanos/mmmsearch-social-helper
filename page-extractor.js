const runtime = globalThis.browser?.runtime || chrome.runtime;

runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'EXTRACT_PROFILE_FROM_PAGE') return false;

  try {
    const { platform, handle } = message.payload || {};
    const profile = platform === 'instagram'
      ? extractInstagramProfile({ handle })
      : platform === 'facebook'
        ? extractFacebookProfile({ handle })
        : null;
    sendResponse(profile ? { ok: true, profile } : { ok: false, errorCode: 'empty_profile' });
  } catch (error) {
    sendResponse({ ok: false, errorCode: String(error?.message || error || 'extract_failed') });
  }

  return false;
});

function extractInstagramProfile({ handle }) {
  const normalizedHandle = String(handle || '').replace(/^@/, '').toLowerCase();
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
  const cleanLine = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const headerRoot = document.querySelector('main header') || document.querySelector('header');
  const headerText = headerRoot?.innerText || document.body?.innerText || '';
  const lines = headerText.split(/\n+/).map(cleanLine).filter(Boolean);
  const isHandleLine = (line) => cleanLine(line).replace(/^@/, '').toLowerCase() === normalizedHandle;
  const isCountLine = (line) => /(^| )[\d.,]+[kmb]?\s+(followers?|following|posts?)\b/i.test(line) || /^(followers?|following|posts?)$/i.test(line);
  const isActionLine = (line) => /\b(follow|following|message|contact|email|call|whatsapp|subscribe|subscribed|requested|edit profile|professional dashboard|ad tools|insights|threads)\b/i.test(line);
  const isMetaNoise = (line) => /\b(meta|instagram|photos and videos|suggested for you)\b/i.test(line);
  const looksLikeDomain = (line) => /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i.test(line);
  const dedupe = (items) => [...new Set(items.filter(Boolean))];
  if (/accounts\/login/i.test(location.pathname)) return null;
  if (normalizedHandle && location.pathname && !location.pathname.toLowerCase().includes(`/${normalizedHandle}`)) return null;
  const html = document.documentElement.innerHTML;
  const text = document.body?.innerText || '';

  const pick = (pattern) => decodeEscaped(html.match(pattern)?.[1] || null);
  const count = (pattern) => {
    const matched = html.match(pattern)?.[1] || text.match(pattern)?.[1];
    return matched != null ? Number.parseInt(String(matched).replace(/[^\d]/g, ''), 10) || parseCount(matched) : null;
  };

  const explicitName = pick(/"full_name":"([^"]+)"/) || document.querySelector('header h1, header h2')?.textContent?.trim() || null;
  const bioFromJson = pick(/"biography":"([^"]*)"/) || null;
  const avatar = pick(/"profile_pic_url_hd":"([^"]+)"/) || pick(/"profile_pic_url":"([^"]+)"/) || document.querySelector('header img')?.src || null;
  const externalUrlFromJson = pick(/"external_url":"([^"]+)"/) || null;
  const followers = count(/"edge_followed_by":\{"count":(\d+)/) || count(/([\d.,]+)\s+followers/i);
  const following = count(/"edge_follow":\{"count":(\d+)/) || count(/([\d.,]+)\s+following/i);
  const posts = count(/"edge_owner_to_timeline_media":\{"count":(\d+)/) || count(/([\d.,]+)\s+posts/i);

  let name = explicitName;
  let externalUrl = externalUrlFromJson;
  let bio = bioFromJson;

  if (!name || !bio || !externalUrl) {
    const candidateLines = dedupe(lines)
      .filter((line) => !isHandleLine(line))
      .filter((line) => !isCountLine(line))
      .filter((line) => !isActionLine(line))
      .filter((line) => !isMetaNoise(line));

    if (!name) {
      name = candidateLines.find((line) => !looksLikeDomain(line) && line.length > 2 && line.length < 80) || handle;
    }

    if (!externalUrl) {
      externalUrl = Array.from((headerRoot || document).querySelectorAll('a[href]'))
        .map((a) => a.href)
        .find((href) => /^https?:\/\//i.test(href) && !/instagram\.com/i.test(href))
        || candidateLines.find((line) => looksLikeDomain(line))
        || null;
      if (externalUrl && !/^https?:\/\//i.test(externalUrl)) externalUrl = `https://${externalUrl.replace(/^www\./i, 'www.')}`;
    }

    if (!bio) {
      const bioLines = candidateLines
        .filter((line) => line !== name)
        .filter((line) => !looksLikeDomain(line))
        .filter((line) => line.length >= 4 && line.length <= 160)
        .slice(0, 6);
      bio = bioLines.length ? bioLines.join(' · ') : null;
    }
  }

  if (!name && !bio && !avatar && !followers && !posts) return null;
  return { name, bio, avatar, externalUrl, followers, following, posts };
}

function extractFacebookProfile({ handle }) {
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
  const title = document.querySelector('meta[property="og:title"]')?.content || document.querySelector('title')?.textContent || handle;
  const avatar = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('img')?.src || null;
  const metaDescription = document.querySelector('meta[property="og:description"]')?.content || document.querySelector('meta[name="description"]')?.content || null;
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
