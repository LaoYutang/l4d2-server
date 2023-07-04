package controller

import (
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

func Restart(c *gin.Context) {
	err := exec.Command("docker", "restart", "l4d2").Run()
	if err != nil {
		c.String(http.StatusInternalServerError, "重启失败")
		return
	}

	c.String(http.StatusOK, "重启成功，请等待服务器启动")
}
