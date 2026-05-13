export default class Game {
    constructor(dataClient) {
        this._dataClient = dataClient;

        this.state = null;
        this.gameId = null;
        this.playerId = null;


        this._dataClient.onOpen(() => {
            console.log(" Game ready (WS open)");
            this.onReady?.();
        });

        this._dataClient.onMessage((msg) => {
            this.handleMessage(msg);
        });
    }

    setSession({ gameId, playerId }) {
        this.gameId = gameId;
        this.playerId = playerId;
    }
    

    dispatch(action) {
        if (!this.gameId || !this.playerId) {
            console.error("Missing gameId/playerId before dispatch");
            return;
        }

        this._dataClient.sendAction(
            this.gameId,
            this.playerId,
            action
        );
    }
    showModal(message) {
    alert(message);
        }


    checkGameOver(state) {
    if (state.winner) {
        this.showModal(`${state.winner} wins!`);
    } else if (state.isDraw) {
        this.showModal("It's a draw!");
    }
}

    handleMessage(msg) {
        switch (msg.type) {

            case "GAME_STATE_INIT":
            case "GAME_STATE_UPDATE":
                this.setState(msg.gameState);
                break;

            default:
                console.warn("Unknown message:", msg);
        }
    }

    setState(newState) {
        this.updateUI(newState);
        this.checkGameOver(newState);

    }

    joinGame(gameId, playerId) {
        this.setSession({ gameId, playerId });
        this._dataClient.joinGame(gameId, playerId);
    }
}