import DataClient from './DataClient.js';
import { config } from './config.js';

const dataClient = new DataClient(config.wsUrl, config.apiUrl);


window.copyURL = function () {
    const url = window.location.href;

    navigator.clipboard.writeText(url)
        .then(() => alert('URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
};

window.goHome = function () {
    window.location.href = `https://versuslobby.com/`;
};


function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        gameId: params.get("id")
    };
}


function initGame() {
    const { gameId } = getUrlParams();
    const playerId = Math.random().toString(36).slice(2, 11);

    dataClient.onMessage((msg) => {

        if (msg.type === 'GAME_STATE_INIT') {
            injectGame(msg, dataClient, gameId, playerId);
        }

        if (msg.type === 'ERROR') {
            console.error("Server error:", msg.message);
        }
    });

    dataClient.connectWebSocket();

    dataClient.joinGame(gameId, playerId);


    window.addEventListener('beforeunload', () => {
        dataClient.leaveGame(gameId, playerId);
    });
}

function injectGame(initMessage, dataClient, gameId, playerId) {
    const { gameState } = initMessage;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `../css/${gameState.gameType}.css`;
    document.head.appendChild(link);

    import(`../js/games/${gameState.gameType}.js`)
        .then((module) => {
            const GameClass = module.default;
            const game = new GameClass(dataClient);

            game.setSession({ gameId, playerId });

            game.setState(gameState || {});
        })
        .catch((err) => {
            console.error("Failed to load game module:", err);
        });
}

initGame();