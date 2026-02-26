# UCSD Transcript Extractor

Extracts transcripts from UCSD lecture videos for AI chat and studying.

## How it works

The web interface automatically extracts transcripts from UCSD podcast URLs. You can then copy the transcript and paste it into your chatbot of choice (ChatGPT, Claude, etc.) to ask questions about the lecture content.

## Usage

1. Run `npm run dev` in the `frontend/` directory
2. Paste a UCSD podcast URL (e.g., `https://podcast.ucsd.edu/watch/fa25/cse150b_a00/11`)
3. Click "Extract" to get the transcript
4. Copy the transcript and paste into your AI chatbot to ask questions

## Files

- `frontend/` - Next.js web interface for transcript extraction
- `extract_url.py` - Debug tool for analyzing podcast URLs and network requests