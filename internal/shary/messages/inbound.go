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
	MessageId string `json:"messageId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
	ClientId string `json:"clientId"`
}

type InboundAnswerPayload struct {
	MessageId string `json:"messageId"`
	ClientId  string `json:"clientId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
}

type InboundIceCandidatePayload struct {
	MessageId string                 `json:"messageId"`
	ClientId  string                 `json:"clientId"`
	Value     map[string]interface{} `json:"value"`
}

type InboundTrackMutedPayload struct {
	TrackKind string `json:"trackKind"`
}

type InboundMessageType string

const (
	InboundOffer        InboundMessageType = "offer"
	InboundAnswer       InboundMessageType = "answer"
	InboundData         InboundMessageType = "data"
	InboundIceCandidate InboundMessageType = "iceCandidate"
	InboundTrackMuted   InboundMessageType = "trackMuted"
)

var InboundPayload = map[InboundMessageType]func() interface{}{
	InboundOffer:        func() interface{} { return &InboundOfferPayload{} },
	InboundAnswer:       func() interface{} { return &InboundAnswerPayload{} },
	InboundData:         func() interface{} { return &InboundDataPayload{} },
	InboundIceCandidate: func() interface{} { return &InboundIceCandidatePayload{} },
	InboundTrackMuted:   func() interface{} { return &InboundTrackMutedPayload{} },
}
