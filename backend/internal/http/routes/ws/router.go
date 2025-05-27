package ws

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/serozhenka/shary/internal/repository/rooms"
	"github.com/serozhenka/shary/internal/services"
)

type RouterCtx struct {
	RoomsRepo      rooms.Repository
	MeetingManager MeetingManager
	Upgrader       *websocket.Upgrader
	AuthService    *services.AuthService
}

func SetupRouter(rg *gin.RouterGroup, ctx *RouterCtx) {
	rg.GET("", ctx.ws)
}
