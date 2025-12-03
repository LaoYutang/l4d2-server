# L4D2 Server

[中文文档](./README_CN.md)

Quick deployment for Left 4 Dead 2 dedicated server.

A complete Left 4 Dead 2 server image with integrated Douban plugin pack and numerous high-quality plugins, ready to use out of the box!
Web management interface eliminates the need to log into the server for map uploads and restarts - everything can be done through the web interface! Supports map switching, download tasks, and server status display.

> Note: The new version of Docker has modified the sock API version. To restart L4D2 using Docker containers, Docker version must be <=28. The deployment methods below have been modified to use RCON for compatibility with all versions.

## One-Click Deployment
Requires Docker and Docker Compose environment with ability to pull images from Docker Hub (Chinese users may need to configure mirror sources or proxies).

```sh
bash <(curl -sL https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```

If your server cannot connect to GitHub, you can download the script manually and upload it to the server. Or use GitHub acceleration services:

```sh
bash <(curl -sL https://gh.dpik.top/https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```

The image includes the complete game server files, requiring 5.XGB of data download. Installation time depends on your server's bandwidth and CPU performance.

## Manual Deployment

Use the `latest` tag for stable releases. If L4D2 has updates, try the `nightly` tag which is built every night.

```sh
docker volume create addons
docker volume create cfg
docker run -d \
  --name l4d2 \
  --restart unless-stopped \
  -p 27015:27015 \
  -p 27015:27015/udp \
  -v addons:/l4d2/left4dead2/addons \
  -v cfg:/l4d2/left4dead2/cfg \
  -e L4D2_TICK=60 \
  -e L4D2_RCON_PASSWORD=your_rcon_password \
  laoyutang/l4d2:latest

# Map manager (optional)
docker run -d \
  --name l4d2-manager \
  --restart unless-stopped \
  -p 27020:27020 \
  -v addons:/addons \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e L4D2_RESTART_BY_RCON=true \
  -e L4D2_MANAGER_PASSWORD=your_web_password \
  -e L4D2_RCON_URL=localhost:27015 \
  -e L4D2_RCON_PASSWORD=your_rcon_password \
  laoyutang/l4d2-manager:latest
```

### Docker Compose Deployment

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
    restart: unless-stopped
    ports:
      - "27015:27015"
      - "27015:27015/udp"
    volumes:
      - addons:/l4d2/left4dead2/addons
      - cfg:/l4d2/left4dead2/cfg
    networks:
      - l4d2-network
    environment:
      - L4D2_TICK=60 # Options: 30, 60, 100
      - L4D2_RCON_PASSWORD=[your_rcon_password]

  # Map manager (optional)
  l4d2-manager:
    image: laoyutang/l4d2-manager:latest
    container_name: l4d2-manager
    restart: unless-stopped
    ports:
      - "27020:27020"
    volumes:
      - addons:/addons
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - L4D2_RESTART_BY_RCON=true
      - L4D2_MANAGER_PASSWORD=[your_web_password]
      - L4D2_RCON_URL=l4d2:27015
      - L4D2_RCON_PASSWORD=[your_rcon_password]
    networks:
      - l4d2-network
```

## Environment Variables

### L4D2 Server
- `L4D2_TICK`: Game tickrate (optional, default: 60, options: 30/60/100)
- `L4D2_RCON_PASSWORD`: RCON password (required)

### L4D2 Manager
- `L4D2_MANAGER_PASSWORD`: Web manager password (required)
- `L4D2_RCON_URL`: RCON address (optional, required for status display and map switching)
- `L4D2_RCON_PASSWORD`: RCON password (optional, required for status display and map switching)
- `L4D2_ADDONS_PATH`: Addons directory path
- `L4D2_RESTART_BY_RCON`: Whether to restart server via RCON command (default: false)
- `L4D2_RESTART_CMD`: Custom restart command (optional, uses Docker restart by default)
- `L4D2_CONTAINER_NAME`: Docker container name to restart (optional, default: "l4d2", effective when L4D2_RESTART_CMD is not set)
- `STEAM_API_KEY`: Steam API key (optional, for querying player playtime, get it from [Steam](https://steamcommunity.com/dev/apikey))

## Map Management

### Manual Method
1. Access the Docker volume directory: `/var/lib/docker/volumes/addons`
2. Restart the server: `docker restart l4d2`
3. Change map in-game as admin

### Using Map Manager (Recommended)
1. Access web interface: `http://your_ip:27020`
2. Select map VPK or ZIP files (multiple selection supported)
3. Click upload
4. Click restart server to reload maps
5. Click view to load maps list, then switch to desired map

## Plugin Modification and Replacement

- Plugins directory: `/var/lib/docker/volumes/addons`
- Config directory: `/var/lib/docker/volumes/cfg`

Modify or replace as needed.

## Admin Setup

After joining the server, type `!root admin_password` to add/remove admins online.

**Note:** The admin password is set in `addons/sourcemod/configs/l4d2_admins_simple.cfg`. Change the default password immediately and restart the server for changes to take effect.

## Windows Server Manager Usage

For Windows servers, you can download and run the server independently. Use the compiled `l4d2-manager.exe` with the `static` folder, configure environment variables, and start.

**Note:** For non-Docker L4D2 servers, the restart function requires configuring environment variables `L4D2_RESTART_BY_RCON` or `L4D2_RESTART_CMD` and `L4D2_ADDONS_PATH`. Refer to `restart.bat` in the project directory for the restart script.

## Build Docker Images Manually

```bash
docker build -f l4d2.Dockerfile -t l4d2 .
docker build -f manager.Dockerfile -t l4d2-manager .
```

## License

This project is open source and available under the MIT License.
