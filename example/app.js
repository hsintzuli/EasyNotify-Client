const PORT = 3001;
// Express Initialization
const express = require('express');
const app = express();


// notifier.init()
app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
  res.sendStatus(404);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  err.status = err.status || 500;
  res.status(err.status);
  console.log(err);
  res.json({
    status: err.status,
    error: err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`Listening on port: ${PORT}`);
});
