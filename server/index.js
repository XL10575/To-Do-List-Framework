// server/index.js
const express = require('express');
const path = require('path');
const cors = require('cors');
// any other imports…

const app = express();

app.use(cors());
app.use(express.json()); // or body-parser

// Serve static files from the 'dist' directory:
app.use(express.static(path.join(__dirname, '../dist')));

// Your API routes:
const posts = require('./routes/api/posts');
app.use('/api/posts', posts);

// Handle SPA (Vue) - redirect all unknown routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
