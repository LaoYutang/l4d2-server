package middlewares

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		password := c.PostForm("password")
		realPassword := os.Getenv("L4D2_MANAGER_PASSWORD")
		if realPassword == "" {
			realPassword = "laoyutangnb"
		}

		if password != realPassword {
			c.String(http.StatusBadRequest, "密码错误")
			c.Abort()
		}

		c.Next()
	}
}
