document.getElementById('fetchBtn').addEventListener('click', async () => {
  const input = document.getElementById('videoUrl');
  const url = input.value.trim();
  const errorDiv = document.getElementById('error');
  const videoInfoDiv = document.getElementById('videoInfo');

  errorDiv.textContent = '';
  videoInfoDiv.style.display = 'none';

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    errorDiv.textContent = 'Please enter a valid YouTube URL.';
    return;
  }

  try {
    const response = await fetch('/api/fetch-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }), // ← correct format
    });

    // Even if status is 500, we want to read JSON (not throw on non-2xx)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Check server logs.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown server error');
    }

    // Success: render data
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('title').textContent = data.title;
    document.getElementById('author').textContent = data.author;
    document.getElementById('views').textContent = new Intl.NumberFormat().format(data.views);

    const formatsDiv = document.getElementById('formats');
    formatsDiv.innerHTML = '';

    if (!data.formats || data.formats.length === 0) {
      formatsDiv.innerHTML = '<p>No downloadable MP4 streams found.</p>';
    } else {
      data.formats.forEach((fmt) => {
        const div = document.createElement('div');
        div.className = 'format-item';
        div.innerHTML = `
          <strong>${fmt.quality}</strong> ${fmt.size ? `· ${fmt.size} MB` : ''}<br>
          <a href="${fmt.url}" target="_blank" rel="noopener" download>Download</a>
        `;
        formatsDiv.appendChild(div);
      });
    }

    videoInfoDiv.style.display = 'block';
  } catch (err) {
    console.error('Fetch error:', err);
    errorDiv.textContent = 'Error: ' + (err.message || 'Failed to fetch video info.');
  }
});
