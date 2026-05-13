// server/routes/index.js
const express = require('express');

const gameRoutes = require('./game');

const router = express.Router();
router.get('/', (req, res) => {
  res.status(200).send('Welcome to Versus Lobby Server');
});
router.use(gameRoutes);


module.exports = router;
