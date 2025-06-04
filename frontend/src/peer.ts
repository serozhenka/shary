import { getOnIceCandidateHandler } from "./messages/handlers/onicecandidate";
import { getOnIceConnectionStateChangeHandler } from "./messages/handlers/oniceconnectionstatechange";
import { getOnNegotiationHandler } from "./messages/handlers/onnegotiationneeded";
import { getOnTrackHandler } from "./messages/handlers/ontrack";

export interface ChatMessage {
  id: string;
  text: string;
  username: string;
  timestamp: number;
  /**
   * Indicates whether the message was created by the local user ("own" message).
   * This is useful to correctly render the message bubble even when several
   * browser tabs are opened under the same account where usernames are
   * identical across peers.
   */
  isOwn?: boolean;
}

export interface Peer {
  id: string;
  username?: string;
  pc: RTCPeerConnection;
  ws: WebSocket;
  remoteStream: MediaStream; // Regular user media (camera + mic)
  remoteScreenStream: MediaStream; // Screen sharing stream
  isPolite: boolean;
  makingOffer: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
  dataChannel?: RTCDataChannel; // For chat functionality
}

export const bootstrapPeerConnection = (
  peer: Peer,
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void,
  onChatMessage?: (message: ChatMessage) => void
): void => {
  const pc = peer.pc;
  pc.onnegotiationneeded = getOnNegotiationHandler(peer);
  pc.oniceconnectionstatechange = getOnIceConnectionStateChangeHandler(peer);
  pc.onicecandidate = getOnIceCandidateHandler(peer);
  pc.ontrack = getOnTrackHandler(peer, handlePeersChange);

  if (!peer.isPolite) {
    try {
      peer.dataChannel = pc.createDataChannel("chat", {
        ordered: true,
      });
      setupDataChannel(peer.dataChannel, onChatMessage);
    } catch (error) {
      console.error(
        `[DATACHANNEL] Error creating data channel for peer ${peer.id}:`,
        error
      );
    }
  } else {
    console.log(
      `[DATACHANNEL] Polite peer ${peer.id} waiting for data channel`
    );
  }

  // Handle incoming data channel (for the polite peer)
  pc.ondatachannel = (event) => {
    peer.dataChannel = event.channel;
    setupDataChannel(event.channel, onChatMessage);
    handlePeersChange((peers) => {
      return peers.map((p) => {
        if (p.id === peer.id) {
          return { ...p, dataChannel: event.channel };
        }
        return p;
      });
    });
  };

  peer.pc = pc;
};

const setupDataChannel = (
  dataChannel: RTCDataChannel,
  onChatMessage?: (message: ChatMessage) => void
) => {
  dataChannel.onmessage = (event) => {
    try {
      const message: ChatMessage = JSON.parse(event.data);
      message.isOwn = false;
      onChatMessage?.(message);
    } catch (error) {
      console.error(`[DATACHANNEL] Error parsing message:`, error);
    }
  };

  dataChannel.onerror = (error) => {
    console.error(`[DATACHANNEL] Channel error:`, {
      label: dataChannel.label,
      error: error,
    });
  };
};
