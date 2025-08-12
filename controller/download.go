package controller

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/disk"
)

type DOWNLOAD_STATUS = uint8

const (
	DOWNLOAD_STATUS_PENDING     DOWNLOAD_STATUS = iota // 等待下载
	DOWNLOAD_STATUS_IN_PROGRESS                        // 下载中
	DOWNLOAD_STATUS_COMPLETED                          // 下载完成
	DOWNLOAD_STATUS_FAILED                             // 下载失败
)

type downloadTask struct {
	url      string          // 下载链接
	status   DOWNLOAD_STATUS // 状态
	message  string          // 错误消息
	progress float64         // 进度
}

// 新增下载任务
func NewDownloadTask(url string) *downloadTask {
	res := &downloadTask{
		url:    url,
		status: DOWNLOAD_STATUS_PENDING,
	}

	// 启动协程下载文件
	go res.download()

	return res
}

// 执行实际的文件下载
func (dt *downloadTask) download() {
	downloadMutex.Lock()
	defer downloadMutex.Unlock()

	dt.status = DOWNLOAD_STATUS_IN_PROGRESS

	// 发送HTTP请求
	resp, err := http.Get(dt.url)
	if err != nil {
		dt.message = fmt.Sprintf("下载失败: %v", err)
		dt.status = DOWNLOAD_STATUS_FAILED
		return
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		dt.message = fmt.Sprintf("HTTP错误: %d", resp.StatusCode)
		dt.status = DOWNLOAD_STATUS_FAILED
		return
	}

	// 从URL中提取文件名
	fileName := dt.getFileNameFromURL()
	if fileName == "" {
		fileName = "downloaded_file"
	}

	// 创建本地文件
	filePath := filepath.Join(BasePath+"temp", fileName)
	err = os.MkdirAll(filepath.Dir(filePath), 0755)
	if err != nil {
		dt.message = fmt.Sprintf("创建目录失败: %v", err)
		dt.status = DOWNLOAD_STATUS_FAILED
		return
	}

	file, err := os.Create(filePath)
	if err != nil {
		fmt.Printf("创建文件失败: %v\n", err)
		dt.status = DOWNLOAD_STATUS_FAILED
		return
	}
	defer file.Close()

	// 获取文件总大小
	totalSize := resp.ContentLength
	var downloaded int64 = 0

	// 创建一个带缓冲的读取器
	buffer := make([]byte, 8192)

	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			// 写入文件
			_, writeErr := file.Write(buffer[:n])
			if writeErr != nil {
				fmt.Printf("写入文件失败: %v\n", writeErr)
				dt.status = DOWNLOAD_STATUS_FAILED
				return
			}

			downloaded += int64(n)

			// 更新进度
			if totalSize > 0 {
				dt.progress = float64(downloaded) / float64(totalSize) * 100.0
			}
		}

		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("读取数据失败: %v\n", err)
			dt.status = DOWNLOAD_STATUS_FAILED
			return
		}
	}

	dt.progress = 100.0
	dt.status = DOWNLOAD_STATUS_COMPLETED

	// 下载完成后处理文件
	if err := ProcessFile(filePath); err != nil {
		dt.message = fmt.Sprintf("文件处理失败: %v", err)
		dt.status = DOWNLOAD_STATUS_FAILED
		// 清理下载的文件
		os.Remove(filePath)
		return
	}

	// 清理临时下载文件
	os.Remove(filePath)
	fmt.Printf("文件下载并处理完成: %s\n", fileName)
}

// 从URL中提取文件名
func (dt *downloadTask) getFileNameFromURL() string {
	// 移除查询参数
	url := strings.Split(dt.url, "?")[0]
	// 提取最后一部分作为文件名
	parts := strings.Split(url, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}

// 获取下载状态
func (dt *downloadTask) GetStatus() DOWNLOAD_STATUS {
	return dt.status
}

// 获取下载进度 (0-100)
func (dt *downloadTask) GetProgress() float64 {
	return dt.progress
}

// 获取错误消息
func (dt *downloadTask) GetMessage() string {
	return dt.message
}

type downloader struct {
	tasks []*downloadTask
}

func NewDownloader() *downloader {
	return &downloader{
		tasks: make([]*downloadTask, 0),
	}
}

func (d *downloader) AddTask(url string) error {
	if stat, err := disk.Usage(BasePath); err != nil {
		return fmt.Errorf("获取磁盘使用信息失败: %v", err)
	} else if stat.UsedPercent > 90 {
		return errors.New("磁盘空间不足，当前使用率超过90%")
	}

	task := NewDownloadTask(url)
	d.tasks = append(d.tasks, task)
	return nil
}

func (d *downloader) GetTasksInfo() []map[string]any {
	var tasksInfo []map[string]any
	for _, task := range d.tasks {
		tasksInfo = append(tasksInfo, map[string]any{
			"status":   task.GetStatus(),
			"progress": task.GetProgress(),
			"message":  task.GetMessage(),
		})
	}
	return tasksInfo
}

var Downloader *downloader
var downloadMutex sync.Mutex

func init() {
	Downloader = NewDownloader()
}

func AddDownloadTask(c *gin.Context) {
	url := c.PostForm("url")
	if url == "" {
		c.String(http.StatusBadRequest, "下载链接不能为空")
		return
	}

	err := Downloader.AddTask(url)
	if err != nil {
		c.String(http.StatusInternalServerError, "添加下载任务失败: %v", err)
		return
	}

	c.String(http.StatusOK, "下载任务已添加")
}

func ClearTasks(c *gin.Context) {
	downloadMutex.Lock()
	defer downloadMutex.Unlock()

	tasks := make([]*downloadTask, 0)
	for _, task := range Downloader.tasks {
		if task.GetStatus() == DOWNLOAD_STATUS_IN_PROGRESS || task.GetStatus() == DOWNLOAD_STATUS_PENDING {
			tasks = append(tasks, task)
		}
	}
	Downloader.tasks = tasks
	c.String(http.StatusOK, "下载任务已清空")
}

func GetDownloadTasksInfo(c *gin.Context) {
	c.JSON(http.StatusOK, Downloader.GetTasksInfo())
}
