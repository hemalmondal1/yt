// api/fetch-video.js
const playdl = require('play-dl');

// Optional: reduce age-restriction issues (not foolproof)
playdl.setToken({ cookie: '' });

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed.' });
  }

  let url;
  try {
    const body = JSON.parse(req.body || '{}');
    url = body.url;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request.' });
  }

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '"url" is required and must be a string.' });
  }

  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return res.status(400).json({ error: 'URL must be from YouTube.' });
  }

  try {
    if (!playdl.validate(url,
