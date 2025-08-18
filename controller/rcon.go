package controller

import (
	"fmt"
	"l4d2-manager/logic"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorcon/rcon"
)

func GetRconMapList(c *gin.Context) {
	c.JSON(http.StatusOK, logic.GetChapterList())
}

func ChangeMap(c *gin.Context) {
	url := os.Getenv("L4D2_RCON_URL")
	if url == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON链接")
		return
	}
	pwd := os.Getenv("L4D2_RCON_PASSWORD")
	if pwd == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON密码")
		return
	}

	mapName := c.PostForm("mapName")
	if mapName == "" {
		c.String(http.StatusBadRequest, "地图名称不能为空")
		return
	}

	conn, err := rcon.Dial(url, pwd)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON连接失败: %v", err)
		return
	}
	defer conn.Close()

	_, err = conn.Execute("changelevel " + mapName)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON命令执行失败: %v", err)
		return
	}
	c.String(http.StatusOK, "地图切换成功")
}

func GetStatus(c *gin.Context) {
	url := os.Getenv("L4D2_RCON_URL")
	if url == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON链接")
		return
	}
	pwd := os.Getenv("L4D2_RCON_PASSWORD")
	if pwd == "" {
		c.String(http.StatusInternalServerError, "服务端未配置RCON密码")
		return
	}

	conn, err := rcon.Dial(url, pwd)
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON连接失败: %v", err)
		return
	}
	defer conn.Close()

	res, err := conn.Execute("status")
	if err != nil {
		c.String(http.StatusInternalServerError, "RCON命令执行失败: %v", err)
		return
	}

	c.JSON(http.StatusOK, parseStatus(res))
}

type User struct {
	Name     string
	Id       int
	SteamId  string
	Ip       string
	Status   string
	Delay    int
	Loss     int
	Duration string
	LinkRate int
}

type Status struct {
	Users    []User
	Players  string
	Map      string
	Hostname string
}

func parseStatus(statusText string) *Status {
	status := &Status{}
	lines := strings.Split(statusText, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// 解析hostname
		if strings.HasPrefix(line, "hostname: ") {
			status.Hostname = strings.TrimPrefix(line, "hostname: ")
		}

		// 解析map
		if strings.HasPrefix(line, "map     : ") {
			status.Map = strings.TrimPrefix(line, "map     : ")
		}

		// 解析players count
		if strings.HasPrefix(line, "players : ") {
			// 匹配格式: "1 humans, 0 bots (18 max)"
			re := regexp.MustCompile(`(\d+) humans, \d+ bots \((\d+) max\)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 2 {
				currentPlayers := matches[1]
				maxPlayers := matches[2]
				status.Players = fmt.Sprintf("%s/%s", currentPlayers, maxPlayers)
			}
		}

		// 解析用户信息 (以#开头的行，但不是注释行)
		if strings.HasPrefix(line, "# ") && !strings.Contains(line, "userid name") && !strings.Contains(line, "end") {
			user := parseUser(line)
			if user != nil {
				status.Users = append(status.Users, *user)
			}
		}
	}

	return status
}

func parseUser(line string) *User {
	// 使用正则表达式解析用户信息
	// # 125 5 "LaoYutang" STEAM_1:1:85790159  2:23:17 41 0 active 60000 61.141.153.96:52904
	// 时间格式: \d+(?::\d+)+ 可以匹配 2:45, 2:45:54, 1:2:45:54 等
	re := regexp.MustCompile(`^#\s*(\d+)\s+(\d+)\s+"([^"]+)"\s+([A-Z_:0-9]+)\s+(\d+(?::\d+)+)\s+(\d+)\s+(\d+)\s+(\w+)\s+(\d+)\s+([0-9.]+:\d+)`)
	matches := re.FindStringSubmatch(line)

	if len(matches) < 11 {
		return nil
	}

	userid, _ := strconv.Atoi(matches[1])
	delay, _ := strconv.Atoi(matches[6])
	loss, _ := strconv.Atoi(matches[7])
	linkRate, _ := strconv.Atoi(matches[9])

	return &User{
		Name:     matches[3],
		Id:       userid,
		SteamId:  matches[4],
		Ip:       matches[10],
		Status:   matches[8],
		Delay:    delay,
		Loss:     loss,
		Duration: matches[5],
		LinkRate: linkRate,
	}
}
