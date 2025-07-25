package main

import (
	"l4d2-manager/controller"
	"l4d2-manager/middlewares"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.StaticFS("/", http.Dir("./static"))

	// 如果maplist.txt不存在，创建一个空的
	mapListPath := controller.BasePath + "maplist.txt"
	if _, err := os.Stat(mapListPath); os.IsNotExist(err) {
		err := os.WriteFile(mapListPath, []byte(""), 0755)
		if err != nil {
			panic("创建maplist.txt失败")
		}
	}

	router.MaxMultipartMemory = 1 << 25 // 限制表单内存缓存为32M
	router.POST("/auth", middlewares.Auth(), controller.Auth)
	router.POST("/upload", middlewares.Auth(), controller.Upload)
	router.POST("/restart", middlewares.Auth(), controller.Restart)
	router.POST("/clear", middlewares.Auth(), controller.Clear)
	router.POST("/list", controller.List)
	router.POST("/remove", middlewares.Auth(), controller.Remove)
	router.POST("/rcon/maplist", middlewares.Auth(), controller.GetRconMapList)
	router.POST("/rcon/changemap", middlewares.Auth(), controller.ChangeMap)

	router.Run(":27020")
}
