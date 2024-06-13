import {
  CommonDataMessage,
  CommonOfferMessage,
  CommonAnswerMessage,
  CommonIceCandidateMessage,
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

export type InboundMessage =
  | InboundDataMessage
  | InboundOfferMessage
  | InboundAnswerMessage
  | InboundClientJoinedMessage
  | InboundClientLeftMessage
  | InboundInitMessage
  | InboundIceCandidateMessage;
