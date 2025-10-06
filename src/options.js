function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({
      apiBaseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      apiKey: '',
      resumeText: ''
    }, resolve);
  });
}

function setSettings(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, resolve);
  });
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim() || 'https://api.openai.com/v1';
  const model = document.getElementById('model').value.trim() || 'gpt-4o-mini';
  const apiKey = document.getElementById('apiKey').value.trim();
  const resumeText = document.getElementById('resumeText').value.trim();
  await setSettings({ apiBaseUrl, model, apiKey, resumeText });
  setStatus('Saved.');
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  await setSettings({ apiKey: '', resumeText: '' });
  document.getElementById('apiKey').value = '';
  document.getElementById('resumeText').value = '';
  setStatus('Cleared.');
});

(async () => {
  const s = await getSettings();
  document.getElementById('apiBaseUrl').value = s.apiBaseUrl || 'https://api.openai.com/v1';
  document.getElementById('model').value = s.model || 'gpt-4o-mini';
  document.getElementById('apiKey').value = s.apiKey || '';
  document.getElementById('resumeText').value = s.resumeText || '';
})();


