# l4d2-server
求生2服务器快速启动

完整的求生之路2服务端镜像，内置了完整的豆瓣整合包，开箱即用！

## 开源地址
[Github](https://github.com/LaoYutang/l4d2-server)

## 启动方式
```sh
docker volume create addons
docker volume create cfg
docker run -d --name l4d2 -p -p 27015:27015 -p 27015:27015/udp -v addons:/l4d2/left4dead2/addons -v cfg:/l4d2/left4dead2/cfg laoyutang/l4d2:latest
```

## 上传地图或修改脚本
docker volume目录  ```/var/lib/docker/volume/addons```  ```/var/lib/docker/volume/cfg```

## 自行打包docker镜像
```docker build -f l4d2.Dockerfile -t l4d2 .```
