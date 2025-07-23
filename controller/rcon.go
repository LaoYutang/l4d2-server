package controller

import (
	"net/http"
	"os"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/gorcon/rcon"
)

func GetRconMapList(c *gin.Context) {
	url := os.Getenv("L4D2_RCON_URL")
	if url == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON链接")
		return
	}
	pwd := os.Getenv("L4D2_RCON_PASSWORD")
	if pwd == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON密码")
		return
	}

	conn, err := rcon.Dial(url, pwd)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON连接失败: %v", err)
		return
	}
	defer conn.Close()

	res, err := conn.Execute("maps *")
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON命令执行失败: %v", err)
		return
	}
	re := regexp.MustCompile(`(\w+)\.bsp`)
	matches := re.FindAllStringSubmatch(res, -1)

	maps := make([]string, 0, len(matches))
	for _, match := range matches {
		if len(match) > 1 {
			maps = append(maps, match[1])
		}
	}
	c.JSON(http.StatusOK, maps)
}

func ChangeMap(c *gin.Context) {
	url := os.Getenv("L4D2_RCON_URL")
	if url == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON链接")
		return
	}
	pwd := os.Getenv("L4D2_RCON_PASSWORD")
	if pwd == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON密码")
		return
	}

	mapName := c.PostForm("mapName")
	if mapName == "" {
		c.String(http.StatusBadRequest, "地图名称不能为空")
		return
	}

	conn, err := rcon.Dial(url, pwd)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON连接失败: %v", err)
		return
	}
	defer conn.Close()

	_, err = conn.Execute("map " + mapName)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON命令执行失败: %v", err)
		return
	}
	c.String(http.StatusOK, "地图切换成功")
}
