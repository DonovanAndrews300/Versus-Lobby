export default class DataClient {
    constructor(apiUrl, wsUrl, playerId) {
        this.apiUrl = apiUrl;
        this.wsUrl = wsUrl;
        this.ws = null;
        this.localStream = null;
        this.gameId = null;
        this.playerId = playerId;
        this.onGameStateUpdate = null; // Callback function to handle game state updates
        this.peer = null;
    }

    connectWebSocket() {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            this.initGameState();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data)
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            if (this.peer) {
                this.peer.destroy();
            }
            console.log('WebSocket connection closed');
        };

        this.ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    }

    handleMessage(message) {
        if (message.type === 'INCOMING_CALL') {
            this.handleIncomingCall(message);
        }

        if (message.gameState) {
            const { gameId, gameState } = message;
            console.log(gameId, gameState)
            if (this.gameId === gameId && this.onGameStateUpdate) {
                // Merge the partial game state into the existing local game state
                this.mergePartialState(gameState); 
            }
        }
    }

    mergePartialState(partialState) {
        if (!this.gameState) {
            this.gameState = {};
        }
        Object.keys(partialState).forEach((key) => {
            if(Array.isArray(partialState[key])){
                this.gameState[key] = partialState[key];
            }
            else if (typeof partialState[key] === 'object' && this.gameState[key]) {
                // For objects like paddles or ball, merge their properties
                this.gameState[key] = {...partialState[key] };
            } else {
                // For primitive values like scores, simply overwrite them
                this.gameState[key] = partialState[key];
            }
        });
        // After merging, trigger the callback to update the UI
        if (this.onGameStateUpdate) {
            this.onGameStateUpdate(partialState);
        }
    }

    handleIncomingCall(message) {
        const { peerId } = message;
        const call = this.peer.call(peerId, this.localStream);
        call.on('stream', remoteStream => {
            const remoteVideo = document.getElementById("remoteVideo");
            remoteVideo.srcObject = remoteStream;
        });
    }

    async createGame(gameData) {
        console.log(gameData)
        try {
            const response = await fetch(`${this.apiUrl}game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gameData)
            });

            const result = await response.json();
            this.gameId = result.gameId;
            return result;
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    async leaveGame(gameId, playerId) {
        try {
            const response = await fetch(`${this.apiUrl}leaveGame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameId, playerId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            if (this.gameId === gameId) {
                this.gameId = null; // Clear the gameId if leaving the current game
            }
            return result;
        } catch (error) {
            console.error('Error leaving game:', error);
            throw error;
        }
    }

    async joinGame(gameId, playerId) {
        try {
            const response = await fetch(`/${this.apiUrl}joinGame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameId, playerId })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, message: ${errorText}`);
            }
            const result = await response.json();
            this.gameId = gameId;
            this.initGameState();
    
            return result;
        } catch (error) {
            console.error('Error joining game:', error);
    
            if (error.message.includes('Too many players')) {
                window.location.href = "/src/pages/fullRoom.html";
            }
    
            throw error; 
        }
    }
    

    sendGameStateUpdate(gameState) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ 
                type: 'UPDATE_GAME_STATE', 
                gameId: this.gameId, 
                playerId: this.playerId, 
                gameState 
            });
            this.ws.send(message);
        } else {
            console.error('WebSocket is not open');
        }
    }

    initGameState() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ 
                type: 'JOIN_GAME', 
                gameId: this.gameId, 
                playerId: this.playerId 
            });
            console.log("initing gs" ,message)
            this.ws.send(message);
        } else {
            console.error('WebSocket is not open');
        }
    }

    async initVideoCall() {
        try {
            const localVideo = document.getElementById("localVideo");
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = this.localStream;
            let videoTrack = this.localStream.getVideoTracks()[0];
            localVideo.addEventListener('pause', () => {
                videoTrack.enabled = false;
              });
              
              localVideo.addEventListener('play', () => {
                videoTrack.enabled = true;
              });
            this.setupPeerConnection();
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }

    setupPeerConnection() {
        this.peer = new Peer(undefined, {
            secure: true,
            path: '/peerjs',
            port: 443,
            host: 'localhost',
        });

        this.peer.on('open', id => {
            console.log('Peer connection open with ID:', id);
            this.ws.send(JSON.stringify({ type: "ADD_PEER", peerId: id, gameId:this.gameId }));
        });

        this.peer.on('call', (call) => {
            call.answer(this.localStream);
            call.on('stream', (remoteStream) => {
                const remoteVideo = document.getElementById("remoteVideo");
                remoteVideo.srcObject = remoteStream;
            });
        });

        this.peer.on('error', err => {
            console.error('PeerJS error:', err);
        });
    }
}
