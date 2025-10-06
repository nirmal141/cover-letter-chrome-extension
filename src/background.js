// Background service worker: handles LLM API calls to keep keys off content pages

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({
      apiKey: '',
      apiBaseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      resumeText: ''
    }, resolve);
  });
}

async function callLLM({ apiKey, apiBaseUrl, model, jobDescription, resumeText }) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`;
  const system = 'You are an assistant that writes succinct, professional, tailored cover letters. Write strictly in first person singular (I, my), 300-450 words, friendly but formal, aligning skills and experience to the job. Avoid fluff, repetition, and markdown; output plain text only. The cover letter should look completely natural and passionate in tone. Don\'t include any citations, references, or any other formatting. Do not include a signature. Start with greeting the hiring team.';
  const user = [
    'Job Description:',
    jobDescription,
    '',
    'Resume:',
    resumeText
  ].join('\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.6
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM HTTP ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('No content returned from LLM');
  return content;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GENERATE_COVER_LETTER') {
    (async () => {
      try {
        const settings = await getSettings();
        if (!settings.apiKey) throw new Error('API key not set. Open the extension options to save it.');
        const coverLetter = await callLLM({
          apiKey: settings.apiKey,
          apiBaseUrl: settings.apiBaseUrl,
          model: settings.model,
          jobDescription: message.jobDescription,
          resumeText: message.resumeText || settings.resumeText || ''
        });
        sendResponse({ ok: true, coverLetter });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();
    return true;
  }
});


