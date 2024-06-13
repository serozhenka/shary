import {
  CommonDataMessage,
  CommonOfferMessage,
  CommonAnswerMessage,
  CommonIceCandidateMessage,
} from "./common";

export interface OutboundDataMessage extends CommonDataMessage {}
export interface OutboundOfferMessage extends CommonOfferMessage {}
export interface OutboundAnswerMessage extends CommonAnswerMessage {}
export interface OutboundIceCandidateMessage
  extends CommonIceCandidateMessage {}

export type OutboundMessage =
  | OutboundDataMessage
  | OutboundOfferMessage
  | OutboundAnswerMessage
  | OutboundIceCandidateMessage;
