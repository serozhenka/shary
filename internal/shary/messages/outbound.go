package messages

type OutboundMessageType string

const (
	OutboudInit         OutboundMessageType = "init"
	OutboudClientJoined OutboundMessageType = "client_joined"
	OutboudClientLeft   OutboundMessageType = "client_left"
	OutboudOffer        OutboundMessageType = "offer"
	OutboudAnswer       OutboundMessageType = "answer"
	OutboudData         OutboundMessageType = "data"
	OutboudIceCandidate OutboundMessageType = "iceCandidate"
	OutboundTrackMuted  OutboundMessageType = "trackMuted"
)

type OutboundWsMessage struct {
	Type    OutboundMessageType `json:"type"`
	Payload interface{}         `json:"payload"`
}

type InitClient struct {
	Id string `json:"id"`
}

type OutboundInitPayload struct {
	Clients []InitClient `json:"clients"`
}

type OutboundClientJoinedPayload struct {
	ClientId string `json:"clientId"`
}

type OutboundClientLeftPayload struct {
	ClientId string `json:"clientId"`
}

type OutboundOfferPayload struct {
	MessageId string `json:"messageId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
	ClientId string `json:"clientId"`
}

type OutboundAnswerPayload struct {
	MessageId string `json:"messageId"`
	ClientId  string `json:"clientId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
}

type OutboundIceCandidatePayload struct {
	MessageId string                 `json:"messageId"`
	ClientId  string                 `json:"clientId"`
	Value     map[string]interface{} `json:"value"`
}

type OutboundTrackMutedPayload struct {
	ClientId  string `json:"clientId"`
	TrackKind string `json:"trackKind"`
}
