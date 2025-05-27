package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/messages"
)

func (ctx *RouterCtx) ws(c *gin.Context) {
	// Get token from query parameters
	token := c.Query("token")
	if token == "" {
		c.String(http.StatusUnauthorized, "Token required")
		return
	}

	// Validate token
	claims, err := ctx.AuthService.ValidateToken(token)
	if err != nil {
		c.String(http.StatusUnauthorized, "Invalid token")
		return
	}

	// Get roomId from query parameters
	roomId := c.Query("roomId")
	if roomId != "" {
		// If roomId is specified, validate that it exists
		_, err := ctx.RoomsRepo.GetRoom(roomId)
		if err != nil {
			c.String(http.StatusNotFound, "Room not found")
			return
		}
	} else {
		// Default to the first room if not specified
		rooms := ctx.RoomsRepo.ListRooms()
		if len(rooms) > 0 {
			roomId = rooms[0].ID
		} else {
			// Create a default room if none exists
			roomModel := ctx.RoomsRepo.CreateRoom("Default Room")
			roomId = roomModel.ID
		}
	}

	meet := ctx.MeetingManager.GetMeeting(roomId)
	if meet == nil {
		meet = ctx.MeetingManager.CreateMeeting(roomId)
	}

	// Upgrade the connection to WebSocket
	conn, err := ctx.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to upgrade connection")
		return
	}

	// Create client and join room
	client := &Client{
		Id:       ksuid.New().String(),
		Username: claims.Username,
		Conn:     conn,
		Messages: make(chan *messages.OutboundWsMessage, 1024),
	}

	meet.Join(client)

	go client.Reader(meet)
	go client.Writer()
}
