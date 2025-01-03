package controller

import (
	"net/http"
	"os"
	"regexp"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
)

func Upload(c *gin.Context) {
	file, err := c.FormFile("map")
	if err != nil {
		c.String(http.StatusBadRequest, "文件信息有误")
		return
	}

	reg := regexp.MustCompile(`\.vpk$`)
	if !reg.Match([]byte(file.Filename)) {
		c.String(http.StatusBadRequest, "错误的文件类型，只支持vpk文件")
		return
	}

	if file.Size > 1<<30 {
		c.String(http.StatusBadRequest, "文件超过1GB，禁止上传")
		return
	}

	_, statErr := os.Stat(BasePath + "maplist.txt")
	if !os.IsNotExist(statErr) {
		maps, readErr := os.ReadFile(BasePath + "maplist.txt")
		if readErr != nil {
			c.String(http.StatusInternalServerError, "获取地图记录文件失败")
			return
		}
		for _, mapName := range strings.Split(string(maps), "\n") {
			if mapName == file.Filename {
				c.String(http.StatusBadRequest, "地图已经存在")
				return
			}
		}
	}

	if err := c.SaveUploadedFile(file, BasePath+file.Filename); err != nil {
		c.String(http.StatusInternalServerError, "文件写入失败")
		return
	}

	// 记录
	list, openErr := os.OpenFile(BasePath+"maplist.txt", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if openErr != nil {
		c.String(http.StatusInternalServerError, "获取地图记录文件句柄失败")
		return
	}
	defer list.Close()

	if _, err := list.WriteString(file.Filename + "\n"); err != nil {
		c.String(http.StatusInternalServerError, "写入地图记录失败")
		return
	}

	c.String(http.StatusOK, "上传成功！")

	runtime.GC()
}
