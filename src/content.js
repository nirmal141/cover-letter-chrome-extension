// Enhanced extraction with site-specific selectors, visibility filtering, and keyword scoring
function extractJobDescriptionText() {
  const isVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const textFromEl = (el) => (el?.innerText || '').replace(/\s+/g, ' ').trim();

  // Site-specific and general selectors
  const selectors = [
    // LinkedIn
    '.jobs-description__container',
    '.jobs-description',
    '#job-details',
    '[data-test="job-details"]',
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '.jobsearch-JobComponent-description',
    // Greenhouse
    '.content .opening .opening',
    '.opening .content',
    '.application .content',
    '#content .section-wrapper',
    // Lever
    '.posting .section.page-full-width',
    '.content .section',
    '#job .content',
    // Workday
    'div[role="main"] [data-automation="jobPostingDescription"]',
    '[data-automation="jobPostingDescription"]',
    '[data-automation="jobAdDetails"]',
    // Ashby, Recruitee, Boards
    '[data-testid="job-description"]',
    '[data-qa="job-description"]',
    '.job-description',
    'section.description',
    'article[role="main"]',
    'article',
    'main',
    // Generic fallbacks
    '[data-test="jobDescription"]',
    '#jobDescription',
    '.description'
  ];

  const keywordWeights = [
    ['responsibilities', 2],
    ['requirements', 2],
    ['qualifications', 2],
    ['preferred', 1],
    ['role', 0.5],
    ['about', 0.5],
    ['benefits', 0.5],
    ['we are', 0.5],
    ['you will', 0.5]
  ];

  const candidates = [];
  const seen = new Set();
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      if (!isVisible(node)) continue;
      const txt = textFromEl(node);
      if (txt.length < 200) continue;
      const key = txt.slice(0, 500);
      if (seen.has(key)) continue;
      seen.add(key);

      // Score: length + keyword density + paragraph count
      const lower = txt.toLowerCase();
      let score = Math.log10(txt.length + 1);
      for (const [kw, w] of keywordWeights) {
        const count = (lower.match(new RegExp(kw, 'g')) || []).length;
        score += count * w;
      }
      const paragraphs = txt.split(/\n{2,}/).length;
      score += Math.min(paragraphs, 10) * 0.3;

      candidates.push({ txt, score });
    }
  }

  // If no selector matched, scan for large visible blocks
  if (candidates.length === 0) {
    const blocks = document.querySelectorAll('section, article, div');
    let best = { txt: '', score: 0 };
    for (const b of blocks) {
      if (!isVisible(b)) continue;
      const txt = textFromEl(b);
      if (txt.split(/\s+/).length < 120) continue;
      const lower = txt.toLowerCase();
      let score = Math.log10(txt.length + 1);
      for (const [kw, w] of keywordWeights) {
        const count = (lower.match(new RegExp(kw, 'g')) || []).length;
        score += count * w;
      }
      if (score > best.score) best = { txt, score };
    }
    if (best.txt) candidates.push(best);
  }

  // As a last resort, use meta description
  if (candidates.length === 0) {
    const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (meta?.content) return meta.content.trim();
    return '';
  }

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0].txt;

  // Trim obvious boilerplate
  const cleaned = chosen
    .replace(/\bapply now\b.*$/i, '')
    .replace(/\bread more\b.*$/i, '')
    .replace(/\babout (us|the role)\b\s*/gi, 'About $1\n')
    .trim();
  return cleaned;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'EXTRACT_JOB_DESCRIPTION') {
    try {
      const text = extractJobDescriptionText();
      sendResponse({ ok: true, text });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return true;
  }
});


