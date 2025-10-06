# Cover Letter Generator (Chrome MV3)

Generate tailored cover letters from job descriptions with your resume using an LLM, then download as PDF.

## Install (Developer Mode)
1. This repo is static (no build step).
2. Open Chrome → `chrome://extensions`.
3. Toggle Developer mode (top-right).
4. Click "Load unpacked" and select this folder.

## Usage
- Open a job post page (LinkedIn, Indeed, etc.).
- Click the extension icon to open the popup.
- Click "Extract Job Description". Review/edit the extracted text.
- Optionally paste resume text in the popup or store it in Options.
- Click "Generate Cover Letter" to call your configured LLM.
- Click "Download PDF" to save.

## Configure API
- Go to extension Options to set:
  - API Base URL (default `https://api.openai.com/v1`)
  - Model (default `gpt-4o-mini`)
  - API Key
  - Resume text (plain text)

## Privacy & Security
- API key is stored via `chrome.storage.local` on your device.
- LLM requests are sent from the background service worker, not content pages.
- Only the job description and your resume text are sent to the LLM endpoint you configure.

## Files
- `manifest.json`: MV3 configuration
- `src/background.js`: calls LLM API and returns generated text
- `src/content.js`: scrapes job description from the active page (now injected programmatically)
- `src/popup.html|css|js`: popup UI, print-to-PDF flow
- `src/options.html|css|js`: API key/model/base URL + resume storage
- `PRIVACY.md`: draft privacy policy for listing

## License
This project is licensed for personal, non-commercial use only. See [LICENSE](LICENSE) for details.

**Important**: This extension may NOT be published to Chrome Web Store or any other browser extension marketplace. It is intended for personal use only.

## Publishing
1. Generate icons:
   - Install Pillow: `python3 -m pip install pillow`
   - Run: `python3 tools/generate_icons.py` (outputs to `icons/icon16.png`, `icon48.png`, `icon128.png`)
2. Bump version in `manifest.json`.
3. Create zip: `python3 tools/zip_extension.py` → `cover-letter-extension.zip`.
4. Upload to Chrome Web Store Developer Dashboard, complete listing, and include PRIVACY.md content.

## Notes
- Selectors for job descriptions are heuristic; add site-specific logic in `src/content.js` if needed.
- You can point `API Base URL` to Perplexity (`https://api.perplexity.ai`, model `sonar`).
