package controller

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func List(c *gin.Context) {
	file, err := os.ReadFile(BasePath + "maplist.txt")
	if err != nil {
		c.String(http.StatusInternalServerError, "读取地图列表失败")
		return
	}

	c.String(http.StatusOK, string(file))
}
