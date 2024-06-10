import {
  CommonDataMessage,
  CommonOfferMessage,
  CommonAnswerMessage,
} from "./common";

export interface OutboundDataMessage extends CommonDataMessage {}
export interface OutboundOfferMessage extends CommonOfferMessage {}
export interface OutboundAnswerMessage extends CommonAnswerMessage {}

export type OutboundMessage =
  | OutboundDataMessage
  | OutboundOfferMessage
  | OutboundAnswerMessage;
