# l4d2-server
求生2服务器快速启动

完整的求生之路2服务端镜像，内置了完整的豆瓣整合包，开箱即用！
地图管理界面，不再需要登录服务器传图重启，页面操作即可！(随便写的比较简陋，但是也够用了！)

# 一键部署
需要docker与docker compose环境，需要能够拉取镜像源，国内需要配置镜像源或代理。
```sh
bash <(curl -sL https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```
服务器无法连接github也可以下载脚本，手动上传都服务器运行。或者使用github加速，如
```sh
bash <(curl -sL https://gh.dpik.top/https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```
镜像中带有完整的游戏服务端，需要下载5.XGB的数据，所以安装时间取决于服务器的带宽和cpu性能。

## 手动部署
稳定版使用lastest标签，如果L4D2有更新，可以尝试使用nightly标签，该镜像每晚打包。
```sh
docker volume create addons
docker volume create cfg
docker run -d \
  --name l4d2 \
  -p 27015:27015 \
  -p 27015:27015/udp \
  -v addons:/l4d2/left4dead2/addons \
  -v cfg:/l4d2/left4dead2/cfg \
  -e L4D2_TICK=60 \
  -e L4D2_RCON_PASSWORD=rcon密码 \
  laoyutang/l4d2:latest

# 地图管理器，可选
docker run -d \
  --name l4d2-manager \
  -p 27020:27020 \
  -v addons:/addons \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e L4D2_MANAGER_PASSWORD=设置上传地图的密码 \
  -e L4D2_RCON_URL=localhost:27015 \
  -e L4D2_RCON_PASSWORD=rcon密码 \
  laoyutang/l4d2-manager:latest
```
docker-compose启动
```yaml
# docker-compose.yaml
volumes:
  addons:
  cfg:

networks:
  l4d2-network:

services:
  l4d2:
    image: laoyutang/l4d2:latest
    container_name: l4d2
    ports:
      - "27015:27015"
      - "27015:27015/udp"
    volumes:
      - addons:/l4d2/left4dead2/addons
      - cfg:/l4d2/left4dead2/cfg
    networks:
      - l4d2-network
    environment:
      - L4D2_TICK=60 # 30,60,100
      - L4D2_RCON_PASSWORD=[rcon密码]
    depends_on:
      - l4d2-manager

  # 地图管理器，可选
  l4d2-manager:
    image: laoyutang/l4d2-manager:latest
    container_name: l4d2-manager
    ports:
      - "27020:27020"
    volumes:
      - addons:/addons
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - L4D2_MANAGER_PASSWORD=[web管理密码]
      - L4D2_RCON_URL=l4d2:27015
      - L4D2_RCON_PASSWORD=[rcon密码]
    networks:
      - l4d2-network
```

## 地图管理
### 手动操作
1. docker volume目录下操作即可  ```/var/lib/docker/volume/addons``` 
2. 重启服务器```docker restart l4d2```
3. 进入服务器后管理员切图
### 使用地图管理器（推荐）
1. 浏览器登录```ip:27020```
2. 选择地图vpk文件或者单层的zip文件（可多选）
3. 点击上传
4. 上传后点击重启服务器以重新加载地图
5. 点击查看以加载地图，切换对应的地图即可

## 插件修改与替换
插件目录为 ```/var/lib/docker/volume/addons``` 
配置目录为 ```/var/lib/docker/volume/cfg```
可以自行按需修改替换

## 管理员设置
进入服务器后，输入```!root 管理员密码```即可在线添加删除管理员
***注意：管理员密码在```addons/sourcemod/configs/l4d2_admins_simple.cfg```中设置，请及时修改默认密码，重启生效***

## 自行打包docker镜像
```docker build -f l4d2.Dockerfile -t l4d2 .```
```docker build -f manager.Dockerfile -t l4d2-manager .```
