# Jitsi-Games
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
1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request
6. Understanding the Game Base Class Structure for making new games:\
    All games made for Jitsi Games must be built off of the 'Game' class. The Game class provides a framework for managing game state and synchronizing it with other players using WebSocket. It includes essential methods that your new game will inherit:
    
    initializeGameState(): Sets up the initial game state for your specific game.
    saveGameState(partialState): Sends updates of the game state over WebSocket.
    mergePartialState(partialState): Receives and merges incoming game state updates from other players, keeping clients synchronized.
    handleRestartGame(): Resets the game state to its initial configuration and broadcasts the reset.
