document.getElementById('fetchBtn').addEventListener('click', async () => {
  const url = document.getElementById('videoUrl').value.trim();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    // Display info
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('title').textContent = data.title;
    document.getElementById('author').textContent = data.author;
    document.getElementById('views').textContent = new Intl.NumberFormat().format(data.views);

    const formatsDiv = document.getElementById('formats');
    formatsDiv.innerHTML = '';

    if (data.formats.length === 0) {
      formatsDiv.innerHTML = '<p>No downloadable MP4 streams available.</p>';
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
    errorDiv.textContent = 'Error: ' + err.message;
  }
});
