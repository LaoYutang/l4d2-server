package logic

import (
	"bufio"
	"io"
	"l4d2-manager/consts"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"git.lubar.me/ben/valve/vpk"
)

// 获取章节列表
func GetChapterList() []*Campaign {
	temp := make([]*Campaign, 0, 16)

	// 扫描addons下的所有vpk文件
	entries, err := os.ReadDir(filepath.Join(consts.BasePath))
	if err != nil {
		log.Printf("读取目录失败: %v", err)
		return nil
	}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(strings.ToLower(entry.Name()), ".vpk") {
			opener := vpk.Single(filepath.Join(consts.BasePath, entry.Name()))
			defer opener.Close()

			archive, err := opener.ReadArchive()
			if err != nil {
				log.Printf("Failed to read VPK archive %s: %v", entry.Name(), err)
				continue
			}

			// 查找missions.txt文件
			var missionFile *vpk.File
			for _, file := range archive.Files {
				if strings.HasPrefix(file.Name(), "missions/") && strings.HasSuffix(file.Name(), ".txt") {
					missionFile = &file
					break
				}
			}
			if missionFile == nil {
				log.Printf("在 VPK %s 中未找到任务文件", entry.Name())
			}

			rc, err := missionFile.Open(opener)
			if err != nil {
				log.Printf("打开 vpk %s 中任务文件 %s 失败: %v", entry.Name(), missionFile.Name(), err)
			}
			defer rc.Close()

			campaign, err := parseMissionFile(rc)
			if err != nil {
				log.Fatalf("解析 %s 任务文件失败: %v", entry.Name(), err)
			}

			temp = append(temp, campaign)
		}
	}

	return temp
}

type Campaign struct {
	Title    string
	Chapters []*Chapter
}

type Chapter struct {
	Code  string
	Title string
}

// 使用正则表达式来更可靠地提取键值对
var kvRegex = regexp.MustCompile(`"([^"]+)"\s+"([^"]+)"`)

func parseMissionFile(reader io.Reader) (*Campaign, error) {
	scanner := bufio.NewScanner(reader)
	campaign := &Campaign{
		Chapters: make([]*Chapter, 0, 8), // 预分配容量
	}

	inCoopSection := false
	braceLevel := 0
	var tempMapName string

	for scanner.Scan() {
		line := scanner.Text()

		if len(line) == 0 {
			continue
		}

		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "//") {
			continue
		}

		// 状态机，用于进入/退出 "coop" 部分
		// 注意：我们只在第一次找到 "coop" 的那一行之后才开始计数括号
		lowerLine := strings.ToLower(line)
		if !inCoopSection && lowerLine == `"coop"` {
			inCoopSection = true
			braceLevel = 0
			continue
		}

		if inCoopSection {
			for _, char := range line {
				switch char {
				case '{':
					braceLevel++
				case '}':
					braceLevel--
				}
			}

			// 如果 braceLevel 降为 0，说明已退出 coop 部分
			// 我们检查 braceLevel <= 0 是为了防止文件格式不规范
			if braceLevel <= 0 {
				inCoopSection = false
				continue
			}
		}

		// 只在必要时使用正则表达式
		if strings.Contains(line, `"`) {
			matches := kvRegex.FindStringSubmatch(line)
			if len(matches) == 3 {
				key := strings.ToLower(matches[1])
				value := matches[2]

				// 始终在文件顶层查找战役标题
				if key == "displaytitle" && campaign.Title == "" {
					campaign.Title = value
				}

				// 如果在 coop 区域内
				if inCoopSection {
					if key == "map" {
						tempMapName = value
					}

					if key == "displayname" && tempMapName != "" {
						chapter := &Chapter{
							Code:  tempMapName,
							Title: value,
						}
						campaign.Chapters = append(campaign.Chapters, chapter)
						tempMapName = "" // 重置
					}
				}
			}
		}
	}

	return campaign, scanner.Err()
}
