package ping

import (
	"github.com/gin-gonic/gin"
)

type RouterCtx struct{}

func SetupRouter(rg *gin.RouterGroup, ctx *RouterCtx) {
	rg.GET("", ctx.Ping)
}
