#!/bin/bash

echo "检查并初始化插件文件..."

# 确保目录存在
mkdir -p /l4d2/left4dead2/addons
mkdir -p /l4d2/left4dead2/cfg

# 检查addons目录是否为空
if [ ! "$(ls -A /l4d2/left4dead2/addons 2>/dev/null)" ]; then
    echo "addons目录为空，正在复制插件文件..."
    if [ -d "/l4d2-backup/left4dead2/addons" ]; then
        cp -r /l4d2-backup/left4dead2/addons/* /l4d2/left4dead2/addons/
        echo "addons插件文件复制完成"
    else
        echo "警告：备份的addons目录不存在"
    fi
else
    echo "addons目录不为空，跳过复制"
fi

# 检查cfg目录是否为空
if [ ! "$(ls -A /l4d2/left4dead2/cfg 2>/dev/null)" ]; then
    echo "cfg目录为空，正在复制配置文件..."
    if [ -d "/l4d2-backup/left4dead2/cfg" ]; then
        cp -r /l4d2-backup/left4dead2/cfg/* /l4d2/left4dead2/cfg/
        echo "cfg配置文件复制完成"
    else
        echo "警告：备份的cfg目录不存在"
    fi
else
    echo "cfg目录不为空，跳过复制"
fi

echo "文件检查和初始化完成，启动服务器..."

# 启动L4D2服务器
cd /l4d2 && ./srcds_run -game left4dead2 -insecure -condebug +hostport 27015 +exec server.cfg
