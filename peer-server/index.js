require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { ExpressPeerServer } = require('peer');

const port = process.env.PORT || 4000;

const app = express();
app.use(cors());

const peerServer = http.createServer(app);

const options = { debug: true };

app.use('/peerjs', ExpressPeerServer(peerServer, options));

peerServer.listen(port, () => {
  console.log(`PeerJS server is running on port ${port}`);
});