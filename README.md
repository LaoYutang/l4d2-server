# l4d2-server
求生2服务器快速启动

完整的求生之路2服务端镜像，内置了完整的豆瓣整合包，开箱即用！
地图管理界面，不再需要登录服务器传图重启，页面操作即可！

## 启动方式
```sh
docker volume create addons
docker volume create cfg
docker run -d --name l4d2 -p 27015:27015 -p 27015:27015/udp -v addons:/l4d2/left4dead2/addons -v cfg:/l4d2/left4dead2/cfg laoyutang/l4d2:latest
docker run -d --name l4d2-manager -p 27020:27020 -v addons:/addons -v /var/run/docker.sock:/var/run/docker.sock -e L4D2_MANAGER_PASSWORD=设置上传地图的密码 laoyutang/l4d2-manager:latest
```

## 上传地图或修改脚本
### 手动操作
docker volume目录下操作即可  ```/var/lib/docker/volume/addons```  ```/var/lib/docker/volume/cfg```
重启服务器```docker restart l4d2```
### 使用laoyutang/l4d2-manager
浏览器登录```ip:27020```即可
## 自行打包docker镜像
```docker build -f l4d2.Dockerfile -t l4d2 .```
```docker build -f manager.Dockerfile -t l4d2-manager .```
