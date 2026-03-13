# Versus Lobby
An app that allows you to play html games with your friends! \
**Read the Whole Readme if you wish to contribute!**\
Built with:\
-Vite\
-Javascript\
-Express\
-Redis\
-Websockets\
-WebRTC(Peer.js) \

## Installation
```sh
git clone
```
client 
```sh
cd client/ npm install
npm run dev
```
server
```sh
cd server/ npm install
npm run start
```
redis
```sh
Install redis to your computer if you haven't already and redis-cli
sudo systemctl start redis
```

## Contributing

1. **Fork it**: ([https://github.com/yourname/yourproject/fork](https://github.com/yourname/yourproject/fork))
2. **Create your feature branch**: `git checkout -b feature/fooBar`
3. **Commit your changes**: `git commit -am 'Add some fooBar'`
4. **Push to the branch**: `git push origin feature/fooBar`
5. **Create a new Pull Request**

---

### 🎮 Building New Games

All games for **Versus Lobby** must extend the `Game` base class. This framework handles the "heavy lifting" of WebSocket networking and state synchronization so you can focus on the HTML/CSS game logic.



#### Core Methods
When creating your game class, you will interact with these inherited methods:

* **`initializeGameState()`**:  Define the starting data structure for your game (e.g., `board: []`, `score: 0`).
* **`renderGame(gameInfo)`**: Use this to inject your HTML into the DOM and set up event listeners.
* **`saveGameState()`**: Call this whenever a player makes a move. It broadcasts your local `this.gameState` to the opponent.
* **`mergePartialState(partialState)`**: Automatically receives and merges incoming data from other players to keep both clients in sync.
* **`handleRestartGame()`**: Resets the game to its initial configuration and broadcasts the reset to the other player.

#### The Development Pattern
To ensure players stay in sync, always follow this 3-step cycle for any player action:
1.  **Update**: Modify the local `this.gameState` object.
2.  **Sync**: Call `this.saveGameState()` to send the update over WebSockets.
3.  **Refresh**: Call your own `updateUI()` method to reflect the changes on the screen.

> **Note:** Use `this._dataClient.playerId` to verify if the local user is the "active" player before allowing them to make a move!
