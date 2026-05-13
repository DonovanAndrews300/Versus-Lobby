export class PeerClient {
    constructor(ws, options = {}) {
        this.ws = ws;
        this.peer = null;
        this.localStream = null;

        this.localVideoEl = document.getElementById(options.localVideoId || "localVideo");
        this.remoteContainer = document.getElementById(options.remoteContainerId || "remoteVideo");

        this.remoteVideos = new Map();
    }

    async init(gameId) {
        await this.initMedia();

        this.peer = new Peer(undefined, {
            secure: true,
            path: '/peerjs',
            port: 443,
            host: 'localhost',
        });

        this.peer.on('open',     (peerId) => {
            this.ws.send(JSON.stringify({
                type: "ADD_PEER",
                peerId,
                gameId
            }));
        });

        this.peer.on('call', (call) => {
            this.handleIncomingCall(call);
        });

        this.peer.on('error', (err) => {
            console.error("Peer error:", err);
        });
    }

    async initMedia() {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        if (this.localVideoEl) {
            this.localVideoEl.srcObject = this.localStream;
            this.localVideoEl.muted = true; // avoid echo
            this.localVideoEl.play();
        }
    }

    handleIncomingCall(call) {
        call.answer(this.localStream);

        call.on('stream', (remoteStream) => {
            this.attachRemoteStream(call.peer, remoteStream);
        });

        call.on('close', () => {
            this.removeRemoteVideo(call.peer);
        });
    }

    startCall(peerId) {
        if (!this.peer || !this.localStream) return;

        const call = this.peer.call(peerId, this.localStream);

        call.on('stream', (remoteStream) => {
            this.attachRemoteStream(peerId, remoteStream);
        });

        call.on('close', () => {
            this.removeRemoteVideo(peerId);
        });
    }

    attachRemoteStream(peerId, stream) {
        // prevent duplicates
        if (this.remoteVideos.has(peerId)) return;

        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;

        video.dataset.peerId = peerId;

        this.remoteContainer?.appendChild(video);
        this.remoteVideos.set(peerId, video);
    }

    removeRemoteVideo(peerId) {
        const video = this.remoteVideos.get(peerId);
        if (video) {
            video.remove();
            this.remoteVideos.delete(peerId);
        }
    }


    destroy() {
        this.peer?.destroy();

        this.remoteVideos.forEach(video => video.remove());
        this.remoteVideos.clear();

        this.localStream?.getTracks().forEach(track => track.stop());
    }
}