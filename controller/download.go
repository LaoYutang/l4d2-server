package controller

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
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
	cancel   chan struct{}   // 取消信号通道
}

// 新增下载任务
func NewDownloadTask(url string) *downloadTask {
	res := &downloadTask{
		url:    url,
		status: DOWNLOAD_STATUS_PENDING,
		cancel: make(chan struct{}),
	}

	// 启动协程下载文件
	go res.download()

	return res
}

// 添加取消方法
func (dt *downloadTask) Cancel() {
	close(dt.cancel)
}

// 执行实际的文件下载
func (dt *downloadTask) download() {
	downloadMutex.Lock()
	defer downloadMutex.Unlock()

	// 检查是否收到取消信号
	select {
	case <-dt.cancel:
		dt.message = "下载已取消"
		dt.status = DOWNLOAD_STATUS_FAILED
		return
	default:
	}

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
	defer func() {
		file.Close()
		os.Remove(filePath) // 清理临时文件
	}()

	// 获取文件总大小
	totalSize := resp.ContentLength
	var downloaded int64 = 0

	// 创建一个带缓冲的读取器
	buffer := make([]byte, 8192)

	for {
		// 检查是否收到取消信号
		select {
		case <-dt.cancel:
			dt.message = "下载已取消"
			dt.status = DOWNLOAD_STATUS_FAILED
			return
		default:
		}

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
		return
	}
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

func splitURLString(urlString string) []string {
	urls := make([]string, 0)

	// 使用正则表达式匹配http和https开头的URL
	re := regexp.MustCompile(`(https?://[^\s\n\r]+)`)
	matches := re.FindAllString(urlString, -1)

	for _, match := range matches {
		// 清理URL，移除可能的尾随空白字符
		cleanURL := strings.TrimSpace(match)
		if cleanURL != "" {
			urls = append(urls, cleanURL)
		}
	}

	return urls
}

type downloader struct {
	tasks []*downloadTask
}

func NewDownloader() *downloader {
	return &downloader{
		tasks: make([]*downloadTask, 0),
	}
}

func (d *downloader) AddTask(url string) {
	task := NewDownloadTask(url)
	d.tasks = append(d.tasks, task)
}

func (d *downloader) GetTasksInfo() []map[string]any {
	var tasksInfo []map[string]any
	for _, task := range d.tasks {
		tasksInfo = append(tasksInfo, map[string]any{
			"url":      task.url,
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
	if stat, err := disk.Usage(BasePath); err != nil {
		c.String(http.StatusInternalServerError, "获取磁盘使用信息失败: %v", err)
	} else if stat.UsedPercent > 90 {
		c.String(http.StatusInsufficientStorage, "磁盘空间不足，当前使用率超过90%")
		return
	}

	url := c.PostForm("url")
	if url == "" {
		c.String(http.StatusBadRequest, "下载链接不能为空")
		return
	}

	// 识别切分多个http连接
	urls := splitURLString(url)
	for _, singleURL := range urls {
		Downloader.AddTask(singleURL)
	}
	c.String(http.StatusOK, "下载任务已添加")
}

func CancelDownloadTask(c *gin.Context) {
	indexStr := c.PostForm("index")
	if indexStr == "" {
		c.String(http.StatusBadRequest, "任务索引不能为空")
		return
	}

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		c.String(http.StatusBadRequest, "任务索引格式错误")
		return
	}

	if index < 0 || index >= len(Downloader.tasks) {
		c.String(http.StatusBadRequest, "任务索引超出范围")
		return
	}

	// 取消指定索引的下载任务
	Downloader.tasks[index].Cancel()
	c.String(http.StatusOK, "下载任务已取消")
}

func ClearTasks(c *gin.Context) {
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
