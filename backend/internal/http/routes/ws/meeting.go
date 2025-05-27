package ws

import (
	"github.com/serozhenka/shary/internal/messages"
	"github.com/serozhenka/shary/internal/models"
	"github.com/serozhenka/shary/internal/utils"
	"golang.org/x/exp/maps"
)

type Meeting struct {
	Clients map[*Client]bool
	Room    *models.Room
}

func NewMeeting() *Meeting {
	return &Meeting{
		Clients: map[*Client]bool{},
		Room:    nil,
	}
}

func (m *Meeting) Join(c *Client) {
	m.Clients[c] = true
	c.Messages <- &messages.OutboundWsMessage{
		Type: messages.OutboudInit,
		Payload: &messages.OutboundInitPayload{
			Clients: func() []messages.InitClient {
				clients := maps.Keys(m.Clients)
				filteredClients := utils.Filter(
					clients,
					func(roomClient *Client) bool {
						return roomClient != c
					},
				)

				return utils.Map(
					filteredClients,
					func(client *Client) messages.InitClient {
						return messages.InitClient{
							Id:       client.Id,
							Username: client.Username,
						}
					},
				)
			}(),
		},
	}
	c.Broadcast(
		m,
		&messages.OutboundWsMessage{
			Type: messages.OutboudClientJoined,
			Payload: &messages.OutboundClientJoinedPayload{
				ClientId: c.Id,
				Username: c.Username,
			},
		},
	)
}

func (m *Meeting) Leave(c *Client) {
	delete(m.Clients, c)
	c.Broadcast(
		m,
		&messages.OutboundWsMessage{
			Type: messages.OutboudClientLeft,
			Payload: &messages.OutboundClientLeftPayload{
				ClientId: c.Id,
			},
		},
	)
}

func (r *Meeting) GetParticipantCount() int {
	return len(r.Clients)
}
