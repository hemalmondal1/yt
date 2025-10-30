// public/script.js
const response = await fetch('http://103.47.226.14:3000/api/fetch-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url }),
});
