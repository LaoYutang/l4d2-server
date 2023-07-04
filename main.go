package main

import (
	"l4d2-manager/controller"
	"l4d2-manager/middlewares"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.StaticFS("/", http.Dir("./static"))

	router.MaxMultipartMemory = 1 << 30 // 限制文件1GB
	router.POST("/upload", middlewares.Auth(), controller.Upload)
	router.POST("/restart", middlewares.Auth(), controller.Restart)
	router.POST("/clear", middlewares.Auth(), controller.Clear)

	router.Run(":27020")
}
