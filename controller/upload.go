package controller

import (
	"archive/zip"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/disk"
)

func Upload(c *gin.Context) {
	if stat, err := disk.Usage(BasePath); err != nil {
		c.String(http.StatusInternalServerError, "获取磁盘使用信息失败: %v", err)
		return
	} else if stat.UsedPercent > 90 {
		c.String(http.StatusInternalServerError, "磁盘空间不足，当前使用率超过90%")
		return
	}

	file, err := c.FormFile("map")
	if err != nil {
		c.String(http.StatusBadRequest, "文件信息有误")
		return
	}

	vpkReg := regexp.MustCompile(`\.(vpk|zip)$`)
	zipReg := regexp.MustCompile(`\.zip$`)
	if !vpkReg.Match([]byte(file.Filename)) && !zipReg.Match([]byte(file.Filename)) {
		c.String(http.StatusBadRequest, "错误的文件类型，只支持vpk或zip文件")
		return
	}

	if file.Size > 2<<30 {
		c.String(http.StatusBadRequest, "文件超过2GB，禁止上传")
		return
	}

	// 处理zip文件
	if zipReg.Match([]byte(file.Filename)) {
		if err := handleZipFile(c, file); err != nil {
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
		c.String(http.StatusOK, "上传并解压成功！")
		runtime.GC()
		return
	}

	// 处理vpk文件
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

	if err := recordMap(file.Filename); err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.String(http.StatusOK, "上传成功！")
	runtime.GC()
}

func handleZipFile(c *gin.Context, file *multipart.FileHeader) error {
	// 保存临时zip文件
	tempZipPath := BasePath + "temp_" + file.Filename
	if err := c.SaveUploadedFile(file, tempZipPath); err != nil {
		return err
	}
	defer os.Remove(tempZipPath) // 清理临时文件

	// 打开zip文件
	reader, err := zip.OpenReader(tempZipPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	vpkReg := regexp.MustCompile(`\.vpk$`)
	var extractedFiles []string

	// 解压vpk文件
	for _, f := range reader.File {
		if vpkReg.MatchString(f.Name) {
			// 检查文件是否已存在
			if err := checkMapExists(filepath.Base(f.Name)); err != nil {
				return err
			}

			// 解压文件
			if err := extractFile(f, BasePath+filepath.Base(f.Name)); err != nil {
				return err
			}
			extractedFiles = append(extractedFiles, filepath.Base(f.Name))
		}
	}

	if len(extractedFiles) == 0 {
		return errors.New("zip文件中未找到vpk文件")
	}

	// 记录所有解压的vpk文件
	for _, fileName := range extractedFiles {
		if err := recordMap(fileName); err != nil {
			return err
		}
	}

	return nil
}

func checkMapExists(filename string) error {
	_, statErr := os.Stat(BasePath + "maplist.txt")
	if !os.IsNotExist(statErr) {
		maps, readErr := os.ReadFile(BasePath + "maplist.txt")
		if readErr != nil {
			return errors.New("获取地图记录文件失败")
		}
		for _, mapName := range strings.Split(string(maps), "\n") {
			if mapName == filename {
				return errors.New("地图 " + filename + " 已经存在")
			}
		}
	}
	return nil
}

func extractFile(f *zip.File, destPath string) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	outFile, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	if err != nil {
		return err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, rc)
	return err
}

func recordMap(filename string) error {
	list, openErr := os.OpenFile(BasePath+"maplist.txt", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if openErr != nil {
		return errors.New("获取地图记录文件句柄失败")
	}
	defer list.Close()

	if _, err := list.WriteString(filename + "\n"); err != nil {
		return errors.New("写入地图记录失败")
	}
	return nil
}
