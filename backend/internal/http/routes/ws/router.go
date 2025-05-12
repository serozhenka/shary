package ws

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/serozhenka/shary/internal/repository/rooms"
)

type RouterCtx struct {
	RoomsRepo      rooms.Repository
	MeetingManager MeetingManager
	Upgrader       *websocket.Upgrader
}

func SetupRouter(rg *gin.RouterGroup, ctx *RouterCtx) {
	rg.GET("", ctx.ws)
}
