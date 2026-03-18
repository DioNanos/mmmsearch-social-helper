const runtime = globalThis.browser?.runtime || chrome.runtime;
const tabsApi = globalThis.browser?.tabs || chrome.tabs;
const EXTRACT_TIMEOUT_MS = 7000;

runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ available: true, version: runtime.getManifest().version });
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
  const tab = await createTab({ url, active: false });
  const tabId = tab?.id;
  if (tabId == null) throw new Error('tab_create_failed');
  try {
    await waitForTabComplete(tabId, EXTRACT_TIMEOUT_MS);
    await sleep(platform === 'facebook' ? 1500 : 900);
    const payload = await sendMessageToTab(tabId, {
      type: 'EXTRACT_PROFILE_FROM_PAGE',
      payload: { platform, url, handle },
    });
    if (!payload?.ok || !payload.profile) return null;
    return {
      platform,
      url,
      handle,
      sourceKind: 'browser-helper',
      source: `browser-helper:${platform}`,
      ...payload.profile,
    };
  } finally {
    try { await removeTab(tabId); } catch { /* ignore */ }
  }
}

function createTab(createProperties) {
  return callTabs('create', createProperties);
}

function removeTab(tabId) {
  return callTabs('remove', tabId);
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    const callback = (response) => {
      const err = runtime.lastError;
      if (err) {
        reject(new Error(err.message || 'message_failed'));
        return;
      }
      resolve(response || null);
    };

    try {
      const maybePromise = tabsApi.sendMessage(tabId, message, callback);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve).catch((error) => reject(error instanceof Error ? error : new Error(String(error))));
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function callTabs(method, ...args) {
  return new Promise((resolve, reject) => {
    try {
      const maybePromise = tabsApi[method](...args, (result) => {
        const err = runtime.lastError;
        if (err) {
          reject(new Error(err.message || `${method}_failed`));
          return;
        }
        resolve(result);
      });
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve).catch((error) => reject(error instanceof Error ? error : new Error(String(error))));
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      tabsApi.onUpdated.removeListener(onUpdated);
      reject(new Error('tab_timeout'));
    }, timeoutMs);

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      tabsApi.onUpdated.removeListener(onUpdated);
      resolve();
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === 'complete') finish();
    };

    tabsApi.onUpdated.addListener(onUpdated);
    callTabs('get', tabId).then((tab) => {
      if (tab?.status === 'complete') finish();
    }).catch(() => {});
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
