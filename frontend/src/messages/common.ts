export interface CommonDataMessage {
  type: "data";
  payload: { message: string };
}

export interface CommonOfferMessage {
  type: "offer";
  payload: {
    value: RTCSessionDescriptionInit;
    clientId: string;
  };
}

export interface CommonAnswerMessage {
  type: "answer";
  payload: {
    value: RTCSessionDescriptionInit;
    clientId: string;
  };
}
