package controller

import "github.com/gin-gonic/gin"

func Auth(c *gin.Context) {
	// 中间件已经验证密码
	c.Next()
}
