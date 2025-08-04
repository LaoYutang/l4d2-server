package middlewares

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v5"
)

func Auth(privateKey []byte) gin.HandlerFunc {
	return func(c *gin.Context) {
		password := c.PostForm("password")
		realPassword := os.Getenv("L4D2_MANAGER_PASSWORD")
		if realPassword == "" {
			realPassword = "laoyutangnb"
		}

		if password == realPassword {
			c.Set("privateKey", privateKey)
			c.Next()
		} else if parsedToken, err := jwt.Parse(password, getKeyfunc(privateKey)); err == nil && parsedToken.Valid {
			c.Next()
		} else {
			c.String(http.StatusBadRequest, "密码错误或令牌已失效")
			c.Abort()
		}
	}
}

func getKeyfunc(privateKey []byte) jwt.Keyfunc {
	return func(token *jwt.Token) (interface{}, error) {
		// 校验签名方法是否匹配
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		// 返回密钥
		return privateKey, nil
	}
}
