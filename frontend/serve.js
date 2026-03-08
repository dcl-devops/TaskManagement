const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Angular 21 outputs to dist/taskflow/browser
let DIST = path.join(__dirname, 'dist/taskflow/browser');
if (!fs.existsSync(DIST)) DIST = path.join(__dirname, 'dist/taskflow');

app.use(express.static(DIST, { maxAge: '1h' }));

// Angular SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TaskFlow frontend serving from ${DIST} on port ${PORT}`);
});
