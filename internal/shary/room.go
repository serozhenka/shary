package shary

import (
	"github.com/serozhenka/shary/internal/shary/messages"
	"github.com/serozhenka/shary/internal/shary/utils"
	"golang.org/x/exp/maps"
)

type Room struct {
	Clients map[*Client]bool
}

func NewRoom() *Room {
	return &Room{
		Clients: map[*Client]bool{},
	}
}

func (r *Room) Join(c *Client) {
	r.Clients[c] = true
	c.Messages <- &messages.OutboundWsMessage{
		Type: messages.OutboudInit,
		Payload: &messages.OutboundInitPayload{
			Clients: func() []messages.InitClient {
				clients := maps.Keys(c.Room.Clients)
				filteredClients := utils.Filter(
					clients,
					func(roomClient *Client) bool {
						return roomClient != c
					},
				)

				return utils.Map(
					filteredClients,
					func(c *Client) messages.InitClient {
						return messages.InitClient{Id: c.Id}
					},
				)
			}(),
		},
	}
	c.Broadcast(
		&messages.OutboundWsMessage{
			Type: messages.OutboudClientJoined,
			Payload: &messages.OutboundClientJoinedPayload{
				ClientId: c.Id,
			},
		},
	)
}

func (r *Room) Leave(c *Client) {
	delete(r.Clients, c)
	c.Broadcast(
		&messages.OutboundWsMessage{
			Type: messages.OutboudClientLeft,
			Payload: &messages.OutboundClientLeftPayload{
				ClientId: c.Id,
			},
		},
	)
}
