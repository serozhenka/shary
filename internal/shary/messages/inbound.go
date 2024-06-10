package messages

import "encoding/json"

type InboundWsMessage struct {
	Type    InboundMessageType `json:"type"`
	Payload json.RawMessage    `json:"payload"`
}

type InboundDataPayload struct {
	Message string `json:"message"`
}

type InboundOfferPayload struct {
	Value struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
	ClientId string `json:"clientId"`
}

type InboundAnswerPayload struct {
	ClientId string `json:"clientId"`
	Value    struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
}

type InboundMessageType string

const (
	InboundOffer  InboundMessageType = "offer"
	InboundAnswer InboundMessageType = "answer"
	InboundData   InboundMessageType = "data"
)

var InboundPayload = map[InboundMessageType]func() interface{}{
	InboundOffer:  func() interface{} { return &InboundOfferPayload{} },
	InboundAnswer: func() interface{} { return &InboundAnswerPayload{} },
	InboundData:   func() interface{} { return &InboundDataPayload{} },
}
