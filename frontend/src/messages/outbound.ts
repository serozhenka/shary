import {
  CommonDataMessage,
  CommonOfferMessage,
  CommonAnswerMessage,
  CommonIceCandidateMessage,
  CommonTrackMutedMessage,
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

export type OutboundMessage =
  | OutboundDataMessage
  | OutboundOfferMessage
  | OutboundAnswerMessage
  | OutboundIceCandidateMessage
  | OutboundTrackMutedMessage;
