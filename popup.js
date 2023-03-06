const form = document.getElementById('control-row');
const go = document.getElementById('go');
const input = document.getElementById('input');
const message = document.getElementById('message');

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      input.value = url.hostname;
    } catch {
      // ignore
    }
  }

  input.focus();
})();

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  clearMessage();

  let url = stringToUrl(input.value);
  if (!url) {
    setMessage('Invalid URL');
    return;
  }

  let message = await getDomainCookies(url.hostname);
  setMessage(message);
}

function stringToUrl(input) {
  // Start with treating the provided value as a URL
  try {
    return new URL(input);
  } catch {
    // ignore
  }
  // If that fails, try assuming the provided input is an HTTP host
  try {
    return new URL('http://' + input);
  } catch {
    // ignore
  }
  // If that fails ¯\_(ツ)_/¯
  return null;
}

async function getDomainCookies(domain) {
  let cookiesDeleted = 0;
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    if (cookies.length === 0) {
      return 'No cookies found';
    }

    let pending = cookies.map(getCookieInfo);

    const result = await Promise.all(pending);

    cookiesDeleted = pending.length;
    return result;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }
  // return `Deleted ${cookiesDeleted} cookie(s).`;
}

function getCookieInfo(cookie) {

  return JSON.stringify({name: cookie.name, value: cookie.value});
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}