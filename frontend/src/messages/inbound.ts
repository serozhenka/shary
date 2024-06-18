import {
  CommonDataMessage,
  CommonOfferMessage,
  CommonAnswerMessage,
  CommonIceCandidateMessage,
  CommonTrackMutedMessage,
} from "./common";

export interface InboundInitMessage {
  type: "init";
  payload: {
    clients: Array<{ id: string }>;
  };
}
export interface InboundDataMessage extends CommonDataMessage {}
export interface InboundOfferMessage extends CommonOfferMessage {}
export interface InboundAnswerMessage extends CommonAnswerMessage {}
export interface InboundIceCandidateMessage extends CommonIceCandidateMessage {}
export interface InboundClientJoinedMessage {
  type: "client_joined";
  payload: {
    clientId: string;
  };
}
export interface InboundClientLeftMessage {
  type: "client_left";
  payload: {
    clientId: string;
  };
}

export interface InboundTrackMutedMessage extends CommonTrackMutedMessage {
  payload: {
    clientId: string;
    trackKind: "audio" | "video";
  };
}

export type InboundMessage =
  | InboundDataMessage
  | InboundOfferMessage
  | InboundAnswerMessage
  | InboundClientJoinedMessage
  | InboundClientLeftMessage
  | InboundInitMessage
  | InboundIceCandidateMessage
  | InboundTrackMutedMessage;
