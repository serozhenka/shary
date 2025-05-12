import {
  CommonAnswerMessage,
  CommonDataMessage,
  CommonIceCandidateMessage,
  CommonOfferMessage,
  CommonTrackMutedMessage,
  CommonTrackUnmutedMessage,
} from "./common";

export interface OutboundDataMessage extends CommonDataMessage {}
export interface OutboundOfferMessage extends CommonOfferMessage {}
export interface OutboundAnswerMessage extends CommonAnswerMessage {}
export interface OutboundIceCandidateMessage
  extends CommonIceCandidateMessage {}

export interface OutboundTrackMutedMessage extends CommonTrackMutedMessage {
  payload: {
    trackKind: "audio" | "video";
  };
}

export interface OutboundTrackUnmutedMessage extends CommonTrackUnmutedMessage {
  payload: {
    trackKind: "audio" | "video";
  };
}

export type OutboundMessage =
  | OutboundDataMessage
  | OutboundOfferMessage
  | OutboundAnswerMessage
  | OutboundIceCandidateMessage
  | OutboundTrackMutedMessage
  | OutboundTrackUnmutedMessage;
