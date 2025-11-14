# One-click server and panel installation
set -e

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  # Install Docker
  echo "Docker is not installed, installing..."
  if curl -s ipinfo.io | grep -q '"country": "CN"'; then
    export DOWNLOAD_URL="https://mirrors.tuna.tsinghua.edu.cn/docker-ce"
  fi
  curl -fsSL https://get.docker.com -o get-docker.sh 
  bash get-docker.sh 
  rm get-docker.sh
  echo "Docker installation completed."
fi

# Ask for admin password and confirm
read -r -s -p "Set admin password: " admin_password
echo
read -r -s -p "Confirm admin password: " admin_password_confirm
echo

if [ "$admin_password" != "$admin_password_confirm" ]; then
    echo "Passwords do not match, please run again"
    exit 1
fi

# Ask for game port, default is 27015
read -r -p "Enter game port (default: 27015): " game_port
game_port=${game_port:-27015}

# Ask for management panel port, default is 27020
read -r -p "Enter management panel port (default: 27020): " manager_port
manager_port=${manager_port:-27020}

# Generate random RCON password
L4D2_RCON_PASSWORD=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 16)

mkdir -p /data/l4d2
# Write docker-compose file
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
      - L4D2_RCON_PASSWORD=$L4D2_RCON_PASSWORD
    logging:
      options:
        max-size: "50m" 
        max-file: "3"

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
      - L4D2_RCON_PASSWORD=$L4D2_RCON_PASSWORD
      - L4D2_RCON_URL=l4d2:27015
    networks:
      - l4d2-network
    logging:
      options:
        max-size: "50m" 
        max-file: "3"
EOF

# Check if in China using ipinfo, add mirror if so
if curl -s ipinfo.io | grep -q '"country": "CN"'; then
  # Ask if using mirror source
  read -r -p "Detected Chinese environment, use Chinese mirror source? (y/n): " use_mirror
  if [[ "$use_mirror" =~ ^[Yy]$ ]]; then
    # Enter mirror source
    read -r -p "Enter Chinese mirror address (default: docker.1ms.run): " mirror_url
    mirror_url=${mirror_url:-docker.1ms.run}
    echo "Configuring compose file to use Chinese mirror..."
    sed -i "s|laoyutang/l4d2:nightly|$mirror_url/laoyutang/l4d2:nightly|" /data/l4d2/docker-compose.yaml
    sed -i "s|laoyutang/l4d2-manager:latest|$mirror_url/laoyutang/l4d2-manager:latest|" /data/l4d2/docker-compose.yaml
  fi
fi

# Start docker-compose
cd /data/l4d2
docker compose up -d

# Add soft links
ln -s /var/lib/docker/volumes/l4d2_addons/_data ./addons
ln -s /var/lib/docker/volumes/l4d2_cfg/_data ./cfg

# Output prompt information
echo "L4D2 server and management panel have been installed and started."