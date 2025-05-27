package rooms

import (
	"github.com/gin-gonic/gin"
	"github.com/serozhenka/shary/internal/repository/rooms"
)

type RouterCtx struct {
	Repo rooms.Repository
}

func SetupRouter(rg *gin.RouterGroup, ctx *RouterCtx) {
	rg.GET("", ctx.listRooms)
	rg.GET("/:id", ctx.getRoom)
	rg.POST("", ctx.createRoom)
	rg.PUT("/:id", ctx.updateRoom)
	rg.DELETE("/:id", ctx.deleteRoom)
	rg.POST("/:id/users", ctx.addUserToRoom)
}
