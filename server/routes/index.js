// server/routes/index.js
const express = require('express');

const gameRoutes = require('./game');
const joinGameRoutes = require('./joinGame');
const leaveGameRoutes = require('./leaveGame');

const router = express.Router();
router.get('/', (req, res) => {
  res.status(200).send('Welcome to Versus Lobby Server');
});
router.use(gameRoutes);
router.use(joinGameRoutes);
router.use(leaveGameRoutes);

module.exports = router;
