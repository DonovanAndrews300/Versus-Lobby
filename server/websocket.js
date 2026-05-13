const WebSocket = require('ws');

const gameHandlers = {
  TicTacToe: require('./handlers/tictactoe'),
};


function createGameHelpers(redisClient, redisPublisher) {
  return {
    async getGame(gameId) {
      const keys = await redisClient.keys('*');

for (const key of keys) {
  const value = await redisClient.get(key);
}
      const raw = await redisClient.get(`game:${gameId}`);
      return raw ? JSON.parse(raw) : null;
    },

    async saveGame(gameId, game) {
      await redisClient.set(`game:${gameId}`, JSON.stringify(game));
    },

    async publishGame(gameId, gameState) {
      console.log("publishing"+ gameState)
      await redisPublisher.publish(
        `game:${gameId}`,
        JSON.stringify({ gameId, gameState })
      );
    },

    async joinGame(gameId, playerId) {
      const game = await this.getGame(gameId);
      if (!game) throw new Error("Game not found id:" + gameId);

      const MAX_PLAYERS = 2;

      if (!game.players.includes(playerId)) {
        if (game.players.length >= MAX_PLAYERS) {
          throw new Error("Too many players");
        }

        game.players.push(playerId);
        await this.saveGame(gameId, game);
      }

      return game;
    },

    async leaveGame(gameId, playerId) {
      const game = await this.getGame(gameId);
      if (!game) return;

      game.players = game.players.filter(p => p !== playerId);

      await this.saveGame(gameId, game);
      await this.publishGame(gameId, game.gameState);
    }
  };
}


async function attach(server, redisClient, redisSubscriber) {
  const redisPublisher = redisClient;
  const game = createGameHelpers(redisClient, redisPublisher);

  const wss = new WebSocket.Server({ server });

  console.log(" WebSocket server attached");


await redisSubscriber.pSubscribe('game:*', (message, channel) => {
  try {
    const { gameId, gameState } = JSON.parse(message);

    wss.clients.forEach(ws => {
      if (
        ws.readyState === WebSocket.OPEN &&
        ws.gameId === gameId
      ) {
        ws.send(JSON.stringify({
          type: 'GAME_STATE_UPDATE',
          gameId,
          gameState
        }));
      }
    });

  } catch (err) {
    console.error("PubSub error:", err);
  }
});
  wss.on('connection', (ws) => {
    console.log("Client connected");

    ws.on('message', async (message) => {
      let parsed;

      try {
        parsed = JSON.parse(message);
      } catch {
        console.error(" Invalid JSON");
        return;
      }

      const { type } = parsed;

      try {
        switch (type) {

          // 🎮 JOIN GAME
          //just pass the type through the function so it knows
          case 'JOIN_GAME': {
            const { gameId, playerId } = parsed;
            const gameState = await game.joinGame(gameId, playerId);

            ws.gameId = gameId;
            ws.playerId = playerId;

            ws.send(JSON.stringify({
              type: 'GAME_STATE_INIT',
              gameId,
              gameState: gameState.gameState
            }));

            break;
          }


          case 'PLAYER_ACTION': {
            const { gameId, playerId, action } = parsed;
            const current = await game.getGame(gameId);
            if (!current) return;

            const handler = gameHandlers[current.gameType];

            if (!handler) {
              console.error(" Missing handler:", current.gameType);
              return;
            }
            const updatedState = handler(
              current.gameState,
              action,
              playerId
            );

            const updatedGame = {
              ...current,
              gameState: updatedState
            };

            await game.saveGame(gameId, updatedGame);
            await game.publishGame(gameId, updatedState);

            break;
          }

          case 'ADD_PEER': {
            const { gameId, peerId } = parsed;

            ws.gameId = gameId;
            ws.peerId = peerId;

            wss.clients.forEach(client => {
              if (
                client !== ws &&
                client.gameId === gameId &&
                client.peerId
              ) {
                client.send(JSON.stringify({
                  type: 'INCOMING_CALL',
                  peerId
                }));
              }
            });

            break;
          }

          default:
            console.warn(" Unknown message type:", type);
        }

      } catch (err) {
        console.error(" Handler error:", err);

        ws.send(JSON.stringify({
          type: 'ERROR',
          message: err.message
        }));
      }
    });

    ws.on('close', async () => {
      console.log(" Client disconnected");
    });
  });

  return wss;
}

module.exports = { attach };