package controller

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"

	"github.com/gin-gonic/gin"
)

func Restart(c *gin.Context) {
	restartCmd := os.Getenv("L4D2_RESTART_CMD")
	if restartCmd == "" {
		containerName := os.Getenv("L4D2_CONTAINER_NAME")
		if containerName == "" {
			containerName = "l4d2"
		}
		restartCmd = "docker restart " + containerName
	}

	var err error
	if runtime.GOOS == "windows" {
		err = exec.Command("cmd.exe", "/c", restartCmd).Run()
	} else {
		err = exec.Command("sh", "-c", restartCmd).Run()
	}
	if err != nil {
		fmt.Println("重启失败:", err)
		c.String(http.StatusInternalServerError, "重启失败")
		return
	}

	c.String(http.StatusOK, "重启成功，请等待服务器启动")
}
