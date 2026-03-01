const WebSocket = require('ws');
const redisClient = require('./redisClient');
const { createClient } = require('redis');

const gameRooms = new Map();

const redisSubscriber = createClient({ url: process.env.REDIS_URL });
redisSubscriber.connect();

function attach(server) {
  const wss = new WebSocket.Server({ server });
  console.log("WebSocket server attached");

  redisSubscriber.pSubscribe('game:*', (message, channel) => {
    const { gameId, gameState } = JSON.parse(message);
    const clients = gameRooms.get(gameId) || [];
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ gameId, gameState }));
      }
    });
  });

  function joinRoom(ws, gameId) {
    if (!gameId) return;

    ws.gameId = gameId;

    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, []);
    }

    const clients = gameRooms.get(gameId);
    if (!clients.includes(ws)) {
      clients.push(ws);
    }

    console.log("ROOM", gameId, "CLIENT COUNT", clients.length);
  }

  wss.on('connection', (ws) => {
    console.log('New client connected');
    console.log("SERVER INSTANCE:", process.pid);

    ws.on('message', async (message) => {
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
        console.log("INCOMING:", parsedMessage);
      } catch {
        console.error("Invalid JSON");
        return;
      }

      const { type, gameId, playerId, gameState } = parsedMessage;
      if (!gameId) return;

      if (playerId) ws.playerId = playerId;

      if (type === 'JOIN_GAME') {
        joinRoom(ws, gameId);

        try {
          const replies = await redisClient.lRange('activeGames', 0, -1);
          const games = replies.map(r => JSON.parse(r));
          const game = games.find(g => g.gameId === gameId);
          ws.send(JSON.stringify({ gameId, gameState: game?.gameState || {} }));
        } catch (err) {
          console.error('Redis error:', err);
        }
        return;
      }

      if (type === 'ADD_PEER') {
        ws.peerId = parsedMessage.peerId;
        const clients = gameRooms.get(ws.gameId) || [];
        clients.forEach(client => {
          if (client !== ws && client.peerId) {
            client.send(JSON.stringify({ type: 'INCOMING_CALL', peerId: ws.peerId }));
          }
        });
        return;
      }

      if (type === 'UPDATE_GAME_STATE') {
        try {
          const replies = await redisClient.lRange('activeGames', 0, -1);
          const games = replies.map(r => JSON.parse(r));
          const gameIndex = games.findIndex(g => g.gameId === gameId);
          if (gameIndex === -1) return;

          const existingGameState = games[gameIndex].gameState || {};

          const existingBoard =
            existingGameState.game && existingGameState.game.length
              ? existingGameState.game
              : Array(9).fill("");

          const incomingBoard = gameState.game || [];

          const mergedBoard = existingBoard.map((cell, idx) => {
            const incomingCell = incomingBoard[idx];
            return incomingCell && incomingCell !== "" ? incomingCell : cell;
          });

          const updatedState = {
            ...existingGameState,
            ...gameState,
            game: mergedBoard,
          };

          games[gameIndex].gameState = updatedState;
          await redisClient.lSet(
            'activeGames',
            gameIndex,
            JSON.stringify(games[gameIndex])
          );


          await redisClient.publish(
            `game:${gameId}`,
            JSON.stringify({ gameId, gameState: updatedState })
          );

        } catch (err) {
          console.error('Redis error:', err);
        }
      }
    });

    ws.on('close', async () => {
      console.log('Client disconnected');

      const clients = gameRooms.get(ws.gameId) || [];
      const index = clients.indexOf(ws);
      if (index !== -1) clients.splice(index, 1);
      if (clients.length === 0) gameRooms.delete(ws.gameId);

      if (!ws.playerId || !ws.gameId) return;

      try {
        const replies = await redisClient.lRange('activeGames', 0, -1);
        const games = replies.map(r => JSON.parse(r));
        const gameIndex = games.findIndex(g => g.gameId === ws.gameId);
        if (gameIndex === -1) return;

        const game = games[gameIndex];
        const playerIndex = game.players.indexOf(ws.playerId);
        if (playerIndex !== -1) game.players.splice(playerIndex, 1);

        await redisClient.lSet(
          'activeGames',
          gameIndex,
          JSON.stringify(game)
        );

        await redisClient.publish(
          `game:${ws.gameId}`,
          JSON.stringify({ gameId: ws.gameId, gameState: game.gameState })
        );
      } catch (err) {
        console.error('Redis error:', err);
      }
    });
  });

  return wss;
}

module.exports = { attach };