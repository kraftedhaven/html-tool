import app from './api/index.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`html-tool API running on http://localhost:${port}`);
});

