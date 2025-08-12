package main

import (
	"l4d2-manager/controller"
	"l4d2-manager/middlewares"
	"net/http"
	"os"

	"github.com/duke-git/lancet/v2/random"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.StaticFS("/", http.Dir("./static"))

	// 如果本地的private.key不存在，创建一个随机HS256密钥
	const privateKeyPath = "./private.key"
	var privateKey []byte
	if _, err := os.Stat(privateKeyPath); os.IsNotExist(err) {
		privateKey = []byte(random.RandNumeralOrLetter(16))
		err := os.WriteFile(privateKeyPath, privateKey, 0600)
		if err != nil {
			panic("创建private.key失败")
		}
	} else {
		privateKey, err = os.ReadFile(privateKeyPath)
		if err != nil {
			panic("读取private.key失败")
		}
	}

	// 如果maplist.txt不存在，创建一个空的
	mapListPath := controller.BasePath + "maplist.txt"
	if _, err := os.Stat(mapListPath); os.IsNotExist(err) {
		err := os.WriteFile(mapListPath, []byte(""), 0755)
		if err != nil {
			panic("创建maplist.txt失败")
		}
	}

	router.MaxMultipartMemory = 1 << 25 // 限制表单内存缓存为32M
	router.POST("/auth", middlewares.Auth(privateKey), controller.Auth)
	router.POST("/auth/getTempAuthCode", middlewares.Auth(privateKey), controller.GetTempAuthCode)
	router.POST("/upload", middlewares.Auth(privateKey), controller.Upload)
	router.POST("/restart", middlewares.Auth(privateKey), controller.Restart)
	router.POST("/clear", middlewares.Auth(privateKey), controller.Clear)
	router.POST("/list", controller.List)
	router.POST("/remove", middlewares.Auth(privateKey), controller.Remove)
	router.POST("/rcon/maplist", middlewares.Auth(privateKey), controller.GetRconMapList)
	router.POST("/rcon/changemap", middlewares.Auth(privateKey), controller.ChangeMap)
	router.POST("/rcon/getstatus", controller.GetStatus)
	router.POST("/download/add", middlewares.Auth(privateKey), controller.AddDownloadTask)
	router.POST("/download/clear", middlewares.Auth(privateKey), controller.ClearTasks)
	router.POST("/download/list", middlewares.Auth(privateKey), controller.GetDownloadTasksInfo)

	router.Run(":27020")
}
