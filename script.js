document.getElementById('fetchBtn').addEventListener('click', async () => {
  const input = document.getElementById('videoUrl');
  const url = input.value.trim();
  const errorDiv = document.getElementById('error');
  const videoInfoDiv = document.getElementById('videoInfo');
  const fetchBtn = document.getElementById('fetchBtn');

  errorDiv.textContent = '';
  errorDiv.classList.remove('show');
  videoInfoDiv.style.display = 'none';
  fetchBtn.disabled = true;
  fetchBtn.textContent = 'Fetching...';

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    showError('Please enter a valid YouTube URL.');
    resetButton();
    return;
  }

  try {
    const response = await fetch('/api/fetch-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned invalid response.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown server error');
    }

    // Update UI
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('title').textContent = data.title;
    document.getElementById('author').textContent = data.author;
    document.getElementById('views').textContent = new Intl.NumberFormat().format(data.views);

    // Build download options for specific qualities
    const desiredQualities = ['360p', '480p', '720p', '1080p'];
    const qualityMap = {};

    // Map available streams by quality label
    for (const fmt of data.formats || []) {
      if (fmt.quality && fmt.url) {
        // Normalize quality (e.g., "720p60" → "720p")
        let cleanQuality = fmt.quality;
        if (cleanQuality.endsWith('p60') || cleanQuality.endsWith('p30')) {
          cleanQuality = cleanQuality.slice(0, -2); // remove frame rate
        }
        if (desiredQualities.includes(cleanQuality)) {
          // Prefer larger file (higher bitrate) if duplicate quality
          if (!qualityMap[cleanQuality] || (fmt.size && (!qualityMap[cleanQuality].size || fmt.size > qualityMap[cleanQuality].size))) {
            qualityMap[cleanQuality] = fmt;
          }
        }
      }
    }

    // Render download buttons
    const downloadOptions = document.getElementById('downloadOptions');
    downloadOptions.innerHTML = '';

    let hasAny = false;
    for (const q of desiredQualities) {
      if (qualityMap[q]) {
        hasAny = true;
        const div = document.createElement('div');
        div.className = 'download-option';
        div.innerHTML = `
          <div>
            <div class="quality">${q}</div>
            <div class="size">${qualityMap[q].size ? `~${qualityMap[q].size} MB` : ''}</div>
          </div>
          <a class="download-btn" href="${qualityMap[q].url}" target="_blank" rel="noopener" download>Download</a>
        `;
        downloadOptions.appendChild(div);
      }
    }

    if (!hasAny) {
      downloadOptions.innerHTML = '<p>No standard resolutions (360p–1080p) available for download.</p>';
    }

    videoInfoDiv.style.display = 'flex';
  } catch (err) {
    console.error('Fetch error:', err);
    showError(err.message || 'Failed to load video info.');
  } finally {
    resetButton();
  }
});

function resetButton() {
  const btn = document.getElementById('fetchBtn');
  btn.disabled = false;
  btn.textContent = 'Fetch Video Info';
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = `❌ ${message}`;
  errorDiv.classList.add('show');
}
