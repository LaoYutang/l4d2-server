#!/bin/bash

echo "检查并初始化插件文件..."

# 确保目录存在
mkdir -p /l4d2/left4dead2/addons
mkdir -p /l4d2/left4dead2/cfg

# 检查addons目录是否为空，不包括maplist.txt
addons_empty=true
shopt -s nullglob
for file in /l4d2/left4dead2/addons/*; do
    [ "$(basename "$file")" = "maplist.txt" ] && continue
    addons_empty=false
    break
done
shopt -u nullglob

if $addons_empty; then
    echo "addons目录为空，正在复制插件文件..."
    if [ -d "/l4d2-backup/addons" ]; then
        cp -r /l4d2-backup/addons/* /l4d2/left4dead2/addons/
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
    if [ -d "/l4d2-backup/cfg" ]; then
        cp -r /l4d2-backup/cfg/* /l4d2/left4dead2/cfg/
        echo "cfg配置文件复制完成"
    else
        echo "警告：备份的cfg目录不存在"
    fi
else
    echo "cfg目录不为空，跳过复制"
fi

# 控制tick配置文件，环境变量L4D2_TICK
REAL_TICK=${L4D2_TICK:-30}  # 默认值为30
if [ "${L4D2_TICK}" = "60" ]; then
    echo "设置tickrate为60"
    cp /l4d2/left4dead2/cfg/server.cfg.60tick /l4d2/left4dead2/cfg/server.cfg
    REAL_TICK=60
elif [ "${L4D2_TICK}" = "100" ]; then
    echo "设置tickrate为100"
    cp /l4d2/left4dead2/cfg/server.cfg.100tick /l4d2/left4dead2/cfg/server.cfg
    REAL_TICK=100
else
    echo "设置tickrate为30"
    cp /l4d2/left4dead2/cfg/server.cfg.30tick /l4d2/left4dead2/cfg/server.cfg
fi


echo "文件检查和初始化完成，启动服务器..."

# 启动L4D2服务器
cd /l4d2 && ./srcds_run -game left4dead2 -insecure -tickrate "${REAL_TICK}" -condebug +hostport 27015 +exec server.cfg
