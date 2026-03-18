const PAGE_SOURCE = 'mmmsearch-page';
const HELPER_SOURCE = 'mmmsearch-social-helper';
const runtime = globalThis.browser?.runtime || chrome.runtime;

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== PAGE_SOURCE || !data.type || !data.requestId) return;

  if (data.type === 'MMMSEARCH_SOCIAL_HELPER_PING') {
    runtime.sendMessage({ type: 'PING' }, (payload) => {
      window.postMessage({
        source: HELPER_SOURCE,
        requestId: data.requestId,
        payload: payload || { available: false },
      }, window.location.origin);
    });
    return;
  }

  if (data.type === 'MMMSEARCH_SOCIAL_HELPER_EXTRACT') {
    runtime.sendMessage({ type: 'EXTRACT_PROFILE', payload: data.payload || {} }, (payload) => {
      window.postMessage({
        source: HELPER_SOURCE,
        requestId: data.requestId,
        payload: payload || { ok: false, errorCode: 'no_response' },
      }, window.location.origin);
    });
  }
});
