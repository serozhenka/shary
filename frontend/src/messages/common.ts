export interface CommonDataMessage {
  type: "data";
  payload: { message: string };
}

export interface CommonOfferMessage {
  type: "offer";
  payload: {
    messageId: string;
    value: RTCSessionDescriptionInit;
    clientId: string;
  };
}

export interface CommonAnswerMessage {
  type: "answer";
  payload: {
    messageId: string;
    value: RTCSessionDescriptionInit;
    clientId: string;
  };
}

export interface CommonIceCandidateMessage {
  type: "iceCandidate";
  payload: {
    messageId: string;
    value: RTCIceCandidate;
    clientId: string;
  };
}

export interface CommonTrackMutedMessage {
  type: "trackMuted";
}

export interface CommonTrackUnmutedMessage {
  type: "trackUnmuted";
}
