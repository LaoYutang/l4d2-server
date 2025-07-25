package controller

import (
	"net/http"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
)

func Restart(c *gin.Context) {
	containerName := os.Getenv("L4D2_CONTAINER_NAME")
	if containerName == "" {
		containerName = "l4d2"
	}
	err := exec.Command("docker", "restart", containerName).Run()
	if err != nil {
		c.String(http.StatusInternalServerError, "重启失败")
		return
	}

	c.String(http.StatusOK, "重启成功，请等待服务器启动")
}
