import { PeerClient } from "./PeerClient";

export default class DataClient {
    constructor(wsUrl, apiUrl) {
        this.wsUrl = wsUrl;
        this.apiUrl = apiUrl;

        this.ws = null;
        this.peer = null;

        this._onMessage = null;
        this._onOpen = null;

        this._queue = [];

    
    }


    onMessage(cb) {
        this._onMessage = cb;
    }

    onOpen(cb) {
        this._onOpen = cb;
    }

    connectWebSocket() {
        this.ws = new WebSocket(this.wsUrl);
        this.peer = new PeerClient(this.ws);

        this.ws.onopen = () => {
            console.log("WS connected");
   
            this._flushQueue();

            this._onOpen?.();
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this._onMessage?.(msg);
            } catch (err) {
                console.error("Invalid WS message:", err);
            }
        };

        this.ws.onclose = () => {
            console.log(" WS disconnected");
        };

        this.ws.onerror = (err) => {
            console.error("WS error:", err);
        };
    }

    send(msg) {
        const payload = JSON.stringify(msg);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        } else {
            console.warn("WS not ready, queuing message:", msg);
            this._queue.push(payload);
        }
    }

    _flushQueue() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        while (this._queue.length > 0) {
            const msg = this._queue.shift();
            this.ws.send(msg);
        }
    }


    sendAction(gameId, playerId, action) {
        this.send({
            type: "PLAYER_ACTION",
            gameId,
            playerId,
            action
        });
    }

    joinGame(gameId, playerId) {
        this.send({
            type: "JOIN_GAME",
            gameId,
            playerId
        });
    }

    leaveGame(gameId, playerId) {
        this.send({
            type: "LEAVE_GAME",
            gameId,
            playerId
        });
    }


    createGame(gameType) {
        return fetch(`${this.apiUrl}createGame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gameType)
        });
    }
}