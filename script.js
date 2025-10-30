document.getElementById('fetchBtn').addEventListener('click', async () => {
  const url = document.getElementById('videoUrl').value.trim();
  const errorDiv = document.getElementById('error');
  const videoInfoDiv = document.getElementById('videoInfo');

  errorDiv.textContent = '';
  videoInfoDiv.style.display = 'none';

  if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
    errorDiv.textContent = 'Please enter a valid YouTube URL.';
    return;
  }

  try {
    // Use yt-api.com (CORS-enabled public API)
    const apiUrl = `https://yt-api.com/api/yt?link=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error('Failed to fetch video data');

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // Display video info
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('title').textContent = data.title;
    document.getElementById('author').textContent = data.author;
    document.getElementById('views').textContent = new Intl.NumberFormat().format(data.views);

    // Show formats
    const formatsDiv = document.getElementById('formats');
    formatsDiv.innerHTML = '';

    // Filter for video+audio streams (mp4 preferred)
    const streams = data.formats
      .filter(f => f.mimeType?.includes('video/mp4') && f.hasAudio && f.hasVideo)
      .sort((a, b) => b.qualityLabel?.localeCompare(a.qualityLabel));

    if (streams.length === 0) {
      formatsDiv.innerHTML = '<p>No downloadable MP4 streams found.</p>';
    } else {
      streams.forEach(stream => {
        const div = document.createElement('div');
        div.className = 'format-item';
        const quality = stream.qualityLabel || `${stream.width}x${stream.height}`;
        div.innerHTML = `
          <strong>${quality}</strong> · ${Math.round(stream.contentLength / (1024 * 1024))} MB<br>
          <a href="${stream.url}" target="_blank" rel="noopener">Download</a>
        `;
        formatsDiv.appendChild(div);
      });
    }

    videoInfoDiv.style.display = 'block';
  } catch (err) {
    console.error(err);
    errorDiv.textContent = 'Error: ' + (err.message || 'Unable to fetch video.');
  }
});
