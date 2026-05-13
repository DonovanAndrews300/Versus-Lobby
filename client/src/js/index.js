import DataClient from './DataClient.js';
import { config } from './config.js';

function generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
}
const btn = document.getElementById("create-game-button");


btn.addEventListener("click", async () => {
    const gameSelect = document.getElementById('game-select');
    const selectedGame = gameSelect.value;

    const _dataClient = new DataClient(config.wsUrl, config.apiUrl);
    const result = await _dataClient.createGame({
            gameType: selectedGame
        });

    const data = await result.json();



const gameId = data.gameId;
    window.location.href =
        `/src/pages/gameContainer.html?id=${gameId}`;
});
