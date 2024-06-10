package shary

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/serozhenka/shary/internal/shary/messages"
	"github.com/serozhenka/shary/internal/shary/utils"
	"golang.org/x/exp/maps"
)

const (
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Client struct {
	Id       string
	Room     *Room
	Conn     *websocket.Conn
	Messages chan *messages.OutboundWsMessage
}

func (c *Client) Broadcast(m *messages.OutboundWsMessage) {
	for peer := range c.Room.Clients {
		if c != peer {
			peer.Messages <- m
		}
	}
}

func (c *Client) Send(receiverId string, m *messages.OutboundWsMessage) {
	for peer := range c.Room.Clients {
		if peer.Id == receiverId {
			peer.Messages <- m
		}
	}
}

func (c *Client) Reader() {
	defer func() {
		c.Conn.Close()
		c.Broadcast(
			&messages.OutboundWsMessage{
				Type: messages.OutboudClientLeft,
				Payload: &messages.OutboundClientLeftPayload{
					ClientId: c.Id,
				},
			},
		)
		c.Room.Leave(c)
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(
		func(string) error {
			c.Conn.SetReadDeadline(time.Now().Add(pongWait))
			return nil
		},
	)

	for {
		wsMessage := &messages.InboundWsMessage{}
		err := c.Conn.ReadJSON(wsMessage)

		if err != nil {
			if strings.Contains(err.Error(), "cannot unmarshal") {
				continue
			}

			break
		}

		payloadFunc, ok := messages.InboundPayload[wsMessage.Type]
		if !ok {
			log.Printf("Unknown payload type: '%v'", wsMessage.Type)
			continue
		}

		payload := payloadFunc()
		json.Unmarshal(wsMessage.Payload, payload)

		switch payload := payload.(type) {
		case *messages.InboundDataPayload:
			c.Broadcast(
				&messages.OutboundWsMessage{
					Type:    messages.OutboudData,
					Payload: wsMessage.Payload,
				},
			)
		case *messages.InboundOfferPayload:
			c.Send(
				payload.ClientId,
				&messages.OutboundWsMessage{
					Type: messages.OutboudOffer,
					Payload: &messages.OutboundOfferPayload{
						Value:    payload.Value,
						ClientId: c.Id,
					},
				},
			)
		case *messages.InboundAnswerPayload:
			c.Send(
				payload.ClientId,
				&messages.OutboundWsMessage{
					Type: messages.OutboudAnswer,
					Payload: &messages.OutboundAnswerPayload{
						Value:    payload.Value,
						ClientId: c.Id,
					},
				},
			)
		}
	}
}

func (c *Client) Writer() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

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

	for {
		select {
		case message, ok := <-c.Messages:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
