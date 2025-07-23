# 一键安装服务器与面板
set -e

# 检测是否有docker
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# 询问管理密码并确认
read -r -s -p "请设置管理密码: " admin_password
echo
read -r -s -p "请确认管理密码: " admin_password_confirm
echo

if [ "$admin_password" != "$admin_password_confirm" ]; then
    echo "两次输入的密码不一致，请重新运行"
    exit 1
fi

# 询问游戏端口，默认为27015
read -r -p "请输入游戏端口 (默认: 27015): " game_port
game_port=${game_port:-27015}

# 询问管理面板端口，默认为27020
read -r -p "请输入管理面板端口 (默认: 27020): " manager_port
manager_port=${manager_port:-27020}

mkdir -p /data/l4d2
# 写入docker-compose文件
cat > /data/l4d2/docker-compose.yaml << EOF
volumes:
  addons:
  cfg:

networks:
  l4d2-network:

services:
  l4d2:
    image: laoyutang/l4d2:nightly
    container_name: l4d2
    ports:
      - "$game_port:27015"
      - "$game_port:27015/udp"
    volumes:
      - addons:/l4d2/left4dead2/addons
      - cfg:/l4d2/left4dead2/cfg
    networks:
      - l4d2-network
    environment:
      - L4D2_TICK=60 # 30,60,100
    depends_on:
      - l4d2-manager

  l4d2-manager:
    image: laoyutang/l4d2-manager:latest
    container_name: l4d2-manager
    ports:
      - "$manager_port:27020"
    volumes:
      - addons:/addons
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - L4D2_MANAGER_PASSWORD=$admin_password
    networks:
      - l4d2-network
EOF

# 启动docker-compose
cd /data/l4d2
docker compose up -d

# 增加软连接
ln -s /var/lib/docker/volumes/l4d2_addons/_data ./addons
ln -s /var/lib/docker/volumes/l4d2_cfg/_data ./cfg

# 输出提示信息
echo "L4D2 服务器和管理面板已安装并启动。"
