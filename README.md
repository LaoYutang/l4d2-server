# l4d2-server
Left 4 Dead 2 Server Quick Start

A complete Left 4 Dead 2 server Docker image with comprehensive integration package and numerous high-quality plugins, ready to use out of the box!
Management interface - no need to log into the server to upload maps and restart. Everything can be done through the web interface! Supports map switching, download tasks, and server status display.

## One-Click Deployment
Requires Docker and Docker Compose environment. Must be able to pull from image sources. In China, you need to configure mirror sources or a proxy.
```sh
bash <(curl -sL https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```
If your server cannot connect to GitHub, you can download the script and upload it manually to the server. Or use a GitHub accelerator, such as:
```sh
bash <(curl -sL https://gh.dpik.top/https://raw.githubusercontent.com/LaoYutang/l4d2-server/master/install.sh)
```
The image includes a complete game server, requiring download of 5.XGB of data, so installation time depends on your server's bandwidth and CPU performance.

## Manual Deployment
Use the `latest` tag for stable version. If L4D2 has updates, you can try the `nightly` tag, which is built every night.
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
  -e L4D2_RCON_PASSWORD=rcon_password \
  laoyutang/l4d2:latest

# Map manager, optional
docker run -d \
  --name l4d2-manager \
  -p 27020:27020 \
  -v addons:/addons \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e L4D2_MANAGER_PASSWORD=your_manager_password \
  -e L4D2_RCON_URL=localhost:27015 \
  -e L4D2_RCON_PASSWORD=rcon_password \
  laoyutang/l4d2-manager:latest
```
Docker Compose startup:
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
      - L4D2_RCON_PASSWORD=[rcon_password]

  # Map manager, optional
  l4d2-manager:
    image: laoyutang/l4d2-manager:latest
    container_name: l4d2-manager
    ports:
      - "27020:27020"
    volumes:
      - addons:/addons
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - L4D2_MANAGER_PASSWORD=[web_manager_password]
      - L4D2_RCON_URL=l4d2:27015
      - L4D2_RCON_PASSWORD=[rcon_password]
    networks:
      - l4d2-network
```

## Environment Variables
### L4D2
- L4D2_TICK: Game tickrate, optional, defaults to 60
- L4D2_RCON_PASSWORD: RCON password, required
### L4D2-MANAGER
- L4D2_MANAGER_PASSWORD: Manager password, required
- L4D2_RCON_URL: RCON address, optional, otherwise status retrieval and map switching features are not supported
- L4D2_RCON_PASSWORD: RCON password, optional, otherwise status retrieval and map switching features are not supported
- L4D2_ADDONS_PATH: Addons path
- L4D2_RESTART_BY_RCON: Whether to restart server via RCON command, defaults to false
- L4D2_RESTART_CMD: Restart command, optional, defaults to using Docker restart
- L4D2_CONTAINER_NAME: Name of Docker container to restart, optional, effective when L4D2_RESTART_CMD is not set, defaults to "l4d2"
- STEAM_API_KEY: Steam API key, optional, used to query player game time, can be obtained from [Steam](https://steamcommunity.com/dev/apikey)

## Map Management
### Manual Operation
1. Operate in the Docker volume directory ```/var/lib/docker/volume/addons``` 
2. Restart server ```docker restart l4d2```
3. After entering the server, admin can switch maps
### Using Map Manager (Recommended)
1. Login via browser ```ip:27020```
2. Select map VPK file or ZIP file (multiple selection supported)
3. Click upload
4. After upload, click restart server to reload maps
5. Click view to load the map, then switch to the corresponding map

## Plugin Modification and Replacement
Plugin directory: ```/var/lib/docker/volume/addons``` 
Configuration directory: ```/var/lib/docker/volume/cfg```
You can modify and replace as needed

## Admin Setup
After entering the server, type ```!root admin_password``` to add or remove admins online
***Note: The admin password is set in ```addons/sourcemod/configs/l4d2_admins_simple.cfg```. Please change the default password promptly. Restart required for changes to take effect.***

## Windows Server Manager Instructions
Windows servers can download and start the server themselves, using the compiled l4d2-manager.exe and static folder. Set environment variables and start!
***Note***: For non-Docker L4D2 servers, restart functionality requires configuring environment variables ```L4D2_RESTART_BY_RCON``` or ```L4D2_RESTART_CMD``` and ```L4D2_ADDONS_PATH```. For restart scripts, refer to ```restart.dat``` in the project directory.

## Build Docker Images Yourself
```docker build -f l4d2.Dockerfile -t l4d2 .```
```docker build -f manager.Dockerfile -t l4d2-manager .```