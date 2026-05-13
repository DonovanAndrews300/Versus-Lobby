const express = require('express');
const { getRedis } = require('../redisClient');

const router = express.Router();

function getInitialState(gameType) {
  switch (gameType.toLowerCase()) {
    case 'tictactoe':
      return {
        game: Array(9).fill(""),
        gameType,
        currentPlayer: "X",
        winner: null
      };
    default:
      return {};
  }
}

router.post('/createGame', async (req, res) => {
  try {
    const redisClient = getRedis();
    const { gameType } = req.body;

    if (!gameType) {
      return res.status(400).json({ error: 'gameType is required' });
    }

    const gameId = Math.random().toString(36).slice(2, 11);

    const game = {
      gameId,
      gameType,
      players: [],
      gameState: getInitialState(gameType),
      createdAt: Date.now()
    };

    await redisClient.set(`game:${gameId}`, JSON.stringify(game));
      const keys = await redisClient.keys('*');
      for (const key of keys) {
        const value = await redisClient.get(key);
}
    console.log(" Game Created:", gameId);

    return res.status(200).json({
      message: 'Game created',
      gameId
    });

  } catch (err) {
    console.error(' Create game error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;