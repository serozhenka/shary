export class Client {
  id: string;
  peerConnection?: RTCPeerConnection;
  ws?: WebSocket;

  constructor(id: string, peerConnection?: RTCPeerConnection, ws?: WebSocket) {
    this.id = id;
    this.peerConnection = peerConnection;
    this.ws = ws;
  }
}
