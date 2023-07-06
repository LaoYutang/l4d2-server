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

	router.MaxMultipartMemory = 1 << 25 // 限制表单内存缓存为32M
	router.POST("/upload", middlewares.Auth(), controller.Upload)
	router.POST("/restart", middlewares.Auth(), controller.Restart)
	router.POST("/clear", middlewares.Auth(), controller.Clear)
	router.POST("/list", controller.List)

	router.Run(":27020")
}
