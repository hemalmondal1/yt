document.getElementById('fetchBtn').addEventListener('click', async () => {
  const input = document.getElementById('videoUrl');
  const url = input.value.trim();
  const errorDiv = document.getElementById('error');
  const videoInfoDiv = document.getElementById('videoInfo');
  const fetchBtn = document.getElementById('fetchBtn');

  // Reset UI
  errorDiv.textContent = '';
  errorDiv.classList.remove('show');
  videoInfoDiv.style.display = 'none';
  fetchBtn.disabled = true;
  fetchBtn.textContent = 'Fetching...';

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    showError('Please enter a valid YouTube URL.');
    fetchBtn.disabled = false;
    fetchBtn.textContent = 'Fetch Video Info';
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
      throw new Error('Server returned invalid response. Check logs.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown error from server');
    }

    // Populate video info
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('title').textContent = data.title;
    document.getElementById('author').textContent = data.author;
    document.getElementById('views').textContent = new Intl.NumberFormat().format(data.views);

    // Render formats
    const formatsDiv = document.getElementById('formats');
    formatsDiv.innerHTML = '';

    if (!data.formats || data.formats.length === 0) {
      formatsDiv.innerHTML = '<p>No downloadable MP4 streams available.</p>';
    } else {
      data.formats.forEach(fmt => {
        const div = document.createElement('div');
        div.className = 'format-item';
        div.innerHTML = `
          <strong>${fmt.quality}</strong> ${fmt.size ? `· ~${fmt.size} MB` : ''}
          <br>
          <a href="${fmt.url}" target="_blank" rel="noopener" download>Download Video</a>
        `;
        formatsDiv.appendChild(div);
      });
    }

    videoInfoDiv.style.display = 'block';
  } catch (err) {
    console.error('Error:', err);
    showError(err.message || 'Failed to fetch video info
