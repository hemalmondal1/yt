// api/fetch-video.js
import { NextRequest } from 'next/server';
import playdl from 'play-dl';

export const config = {
  runtime: 'nodejs',
  maxDuration: 10, // seconds (Vercel free tier limit)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validate and fetch video info
    if (!playdl.validate(url, 'yt_video')) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const video = await playdl.video_info(url);
    const formats = [];

    // Get downloadable streams (video + audio)
    for (const format of video.video_details.formats) {
      if (
        format.mimeType?.includes('video/mp4') &&
        format.hasVideo &&
        format.hasAudio &&
        format.url // direct download URL
      ) {
        formats.push({
          url: format.url,
          quality: format.qualityLabel || `${format.width}x${format.height}`,
          size: format.contentLength ? Math.round(format.contentLength / (1024 * 1024)) : null,
        });
      }
    }

    // Sort by quality (highest first)
    formats.sort((a, b) => (b.quality || '').localeCompare(a.quality || ''));

    res.status(200).json({
      title: video.video_details.title,
      author: video.video_details.channel.name,
      thumbnail: video.video_details.thumbnails[0]?.url,
      views: video.video_details.views,
      formats: formats.slice(0, 5), // limit to top 5
    });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video data. Video may be restricted.' });
  }
}
