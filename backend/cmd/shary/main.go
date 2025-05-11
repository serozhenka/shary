package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/shary"
	"github.com/serozhenka/shary/internal/shary/messages"
	"github.com/serozhenka/shary/internal/shary/utils"
	"golang.org/x/exp/maps"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // todo: more granular check
	},
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "*")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	r := gin.Default()
	r.Use(CORSMiddleware())
	room := shary.NewRoom()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "hello world"})
	})
	r.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"data": "Internal error"})
			return
		}

		client := &shary.Client{
			Id:       ksuid.New().String(),
			Room:     room,
			Conn:     conn,
			Messages: make(chan *messages.OutboundWsMessage, 1024),
		}

		room.Join(client)

		go client.Reader()
		go client.Writer()
	})
	r.GET("/clients", func(c *gin.Context) {
		c.JSON(
			http.StatusOK,
			gin.H{
				"data": utils.Map(
					maps.Keys(room.Clients),
					func(c *shary.Client) gin.H {
						return gin.H{"clientId": c.Id}
					},
				),
			},
		)
		fmt.Println(room.Clients)
	})

	r.Run("0.0.0.0:8000")
}
