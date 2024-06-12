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
