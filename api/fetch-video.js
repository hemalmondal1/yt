// api/fetch-video.js
import playdl from 'play-dl';

// Disable cookies to avoid age-restriction issues
playdl.setToken({
  cookie: '',
});

export default async function handler(req, res) {
  // Always set JSON response header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let url;
  try {
    // Parse body safely
    const body = JSON.parse(req.body || '{}');
    url = body.url;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" field.' });
  }

  // Basic URL validation
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return res.status(400).json({ error: 'Not a YouTube URL.' });
  }

  try {
    // Validate with play-dl
    if (!playdl.validate(url, 'yt_video')) {
      return res.status(400).json({ error: 'Invalid YouTube video URL.' });
    }

    const video = await playdl.video_info(url);
    const formats = [];

    for (const format of video.video_details.formats || []) {
      if (
        format.mimeType?.includes('video/mp4') &&
        format.hasVideo &&
        format.hasAudio &&
        format.url
      ) {
        formats.push({
          url: format.url,
          quality: format.qualityLabel || `${format.width}x${format.height}`,
          size: format.contentLength ? Math.round(format.contentLength / (1024 * 1024)) : null,
        });
      }
    }

    formats.sort((a, b) => {
      const aQ = parseInt(a.quality) || 0;
      const bQ = parseInt(b.quality) || 0;
      return bQ - aQ;
    });

    res.status(200).json({
      title: video.video_details.title,
      author: video.video_details.channel?.name || 'Unknown',
      thumbnail: video.video_details.thumbnails?.[0]?.url || '',
      views: video.video_details.views || 0,
      formats: formats.slice(0, 5),
    });
  } catch (err) {
    console.error('Server error:', err.message || err);

    // ALWAYS return JSON — never let Vercel show HTML error
    res.status(500).json({
      error: 'Failed to process video. It may be age-restricted, private, or unavailable.',
    });
  }
}
