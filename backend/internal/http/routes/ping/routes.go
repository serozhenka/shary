package ping

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (c *RouterCtx) Ping(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{"data": "hello world"})
}
