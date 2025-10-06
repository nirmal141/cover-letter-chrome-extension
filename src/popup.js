async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extractJobDescription() {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('No active tab');
  const url = tab.url || '';
  if (/^chrome:\/\//.test(url) || /chrome\.google\.com\/.+webstore/.test(url)) {
    throw new Error('This page blocks extensions. Open the job post in a normal tab.');
  }
  // Try messaging first
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DESCRIPTION' });
    if (res?.ok) return res.text || '';
  } catch (_) {
    // no-op, will inject and retry
  }
  // Inject content script and retry
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content.js'] });
  } catch (_) {}
  const res2 = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DESCRIPTION' });
  if (!res2?.ok) throw new Error(res2?.error || 'Extraction failed');
  return res2.text || '';
}

async function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ resumeText: '', apiKey: '', apiBaseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }, resolve);
  });
}

function saveStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('extractBtn').addEventListener('click', async () => {
  try {
    saveStatus('Extracting...');
    const text = await extractJobDescription();
    document.getElementById('jobDesc').value = text;
    saveStatus('Job description extracted.');
  } catch (e) {
    saveStatus(String(e));
  }
});

document.getElementById('generateBtn').addEventListener('click', async () => {
  try {
    saveStatus('Generating via LLM...');
    const jobDescription = document.getElementById('jobDesc').value.trim();
    const resumeInput = document.getElementById('resumeText').value.trim();
    const settings = await getStoredSettings();
    const resumeText = resumeInput || settings.resumeText || '';
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_COVER_LETTER',
      jobDescription,
      resumeText
    });
    if (!response?.ok) throw new Error(response?.error || 'LLM generation failed');
    document.getElementById('output').value = response.coverLetter;
    saveStatus('Cover letter generated.');
  } catch (e) {
    saveStatus(String(e));
  }
});

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
  try {
    saveStatus('Preparing print…');
    const text = document.getElementById('output').value.trim();
    if (!text) throw new Error('No cover letter content.');
    const today = new Date().toISOString().slice(0,10);
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cover Letter ${today}</title>
    <style>
      @page { margin: 1in; }
      body { font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; color: #0f172a; line-height: 1.5; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      pre { white-space: pre-wrap; word-wrap: break-word; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size: 12pt; }
      @media (prefers-color-scheme: dark) { body { color: #e5e7eb; } }
    </style>
  </head>
  <body>
    <h1>Cover Letter — ${today}</h1>
    <pre>${escapeHtml(text)}</pre>
    <script>
      window.addEventListener('load', () => setTimeout(() => { window.print(); }, 50));
    </script>
  </body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) throw new Error('Popup blocked. Allow popups for this extension.');
    win.document.open();
    win.document.write(html);
    win.document.close();
    saveStatus('Printing window opened. Use "Save as PDF".');
  } catch (e) {
    saveStatus(String(e));
  }
});

// Load defaults
(async () => {
  const settings = await getStoredSettings();
  if (settings.resumeText) {
    document.getElementById('resumeText').placeholder = 'Using resume stored in Options (visible if pasted here).';
  }
})();


