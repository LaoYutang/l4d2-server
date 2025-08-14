package controller

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/axgle/mahonia"
)

var chineseDecoder = mahonia.NewDecoder("gbk")

// checkMapExists 检查地图文件是否已存在
func checkMapExists(filename string) error {
	_, statErr := os.Stat(MapListFilePath)
	if !os.IsNotExist(statErr) {
		maps, readErr := os.ReadFile(MapListFilePath)
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

// extractFile 从zip文件中解压单个文件
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

// recordMap 将地图文件名记录到maplist.txt
func recordMap(filename string) error {
	mutex.Lock()
	defer mutex.Unlock()

	list, openErr := os.OpenFile(MapListFilePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if openErr != nil {
		return errors.New("获取地图记录文件句柄失败")
	}
	defer list.Close()

	if _, err := list.WriteString(filename + "\n"); err != nil {
		return errors.New("写入地图记录失败")
	}
	return nil
}

// sanitizeFilename 清理文件名中的空格和特殊符号，替换为下划线
func sanitizeFilename(filename string) string {
	// 分离文件名和扩展名
	ext := filepath.Ext(filename)
	nameWithoutExt := strings.TrimSuffix(filename, ext)

	// 使用正则表达式匹配需要替换的字符
	// 匹配空格、特殊符号等，但保留中文字符、英文字母、数字、连字符、下划线和点号
	reg := regexp.MustCompile(`[^\p{L}\p{N}\-_.]+`)
	cleanName := reg.ReplaceAllString(nameWithoutExt, "_")

	// 如果存在myl4d2addons_前缀则去除
	cleanName = strings.TrimPrefix(cleanName, "myl4d2addons_")

	return cleanName + ext
}

// ProcessFile 处理文件（vpk或zip），统一的文件处理入口
func ProcessFile(filePath string) error {
	fileName := filepath.Base(filePath)

	// 检查文件类型
	vpkReg := regexp.MustCompile(`\.vpk$`)
	zipReg := regexp.MustCompile(`\.zip$`)

	if !vpkReg.MatchString(fileName) && !zipReg.MatchString(fileName) {
		return errors.New("不支持的文件类型，只支持vpk或zip文件")
	}

	// 处理zip文件 - 解压并提取vpk文件
	if zipReg.MatchString(fileName) {
		return ProcessZipFile(filePath)
	}

	// 处理vpk文件 - 直接移动到目标目录
	if vpkReg.MatchString(fileName) {
		return ProcessVpkFile(filePath)
	}

	return nil
}

// ProcessZipFile 处理zip文件，解压并提取vpk文件
func ProcessZipFile(zipPath string) error {
	// 打开zip文件
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开zip文件失败: %v", err)
	}
	defer reader.Close()

	vpkReg := regexp.MustCompile(`\.vpk$`)
	var extractedFiles []string

	// 解压vpk文件
	for _, f := range reader.File {
		name := f.Name
		if f.NonUTF8 {
			name = chineseDecoder.ConvertString(f.Name)
		}
		if vpkReg.MatchString(name) {
			// 清理文件名
			cleanName := sanitizeFilename(filepath.Base(name))

			// 检查文件是否已存在
			if err := checkMapExists(cleanName); err != nil {
				return err
			}

			// 解压文件到目标目录
			destPath := filepath.Join(BasePath, cleanName)
			if err := extractFile(f, destPath); err != nil {
				return fmt.Errorf("解压文件失败: %v", err)
			}
			extractedFiles = append(extractedFiles, cleanName)
		}
	}

	if len(extractedFiles) == 0 {
		return errors.New("zip文件中未找到vpk文件")
	}

	// 记录所有解压的vpk文件
	for _, fileName := range extractedFiles {
		if err := recordMap(fileName); err != nil {
			return fmt.Errorf("记录地图失败: %v", err)
		}
	}

	return nil
}

// ProcessVpkFile 处理vpk文件，直接移动到目标目录
func ProcessVpkFile(vpkPath string) error {
	fileName := filepath.Base(vpkPath)
	cleanName := sanitizeFilename(fileName)

	// 检查文件是否已存在
	if err := checkMapExists(cleanName); err != nil {
		return err
	}

	// 移动文件到目标目录
	destPath := filepath.Join(BasePath, cleanName)
	if err := os.Rename(vpkPath, destPath); err != nil {
		// 如果重命名失败，尝试复制
		if err := copyFile(vpkPath, destPath); err != nil {
			return fmt.Errorf("移动文件失败: %v", err)
		}
	}

	// 记录地图
	if err := recordMap(cleanName); err != nil {
		// 如果记录失败，删除已复制的文件
		os.Remove(destPath)
		return fmt.Errorf("记录地图失败: %v", err)
	}

	return nil
}

// copyFile 复制文件的工具函数
func copyFile(src, dest string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}
