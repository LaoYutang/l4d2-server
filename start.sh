#!/bin/bash

echo "Checking and initializing plugin files..."

# Ensure directories exist
mkdir -p /l4d2/left4dead2/addons
mkdir -p /l4d2/left4dead2/cfg

# Check if addons directory is empty, excluding maplist.txt
addons_empty=true
shopt -s nullglob
for file in /l4d2/left4dead2/addons/*; do
    [ "$(basename "$file")" = "maplist.txt" ] && continue
    addons_empty=false
    break
done
shopt -u nullglob

if $addons_empty; then
    echo "Addons directory is empty, copying plugin files..."
    if [ -d "/l4d2-backup/addons" ]; then
        cp -r /l4d2-backup/addons/* /l4d2/left4dead2/addons/
        echo "Addons plugin files copied"
    else
        echo "Warning: Backup addons directory does not exist"
    fi
else
    echo "Addons directory is not empty, skipping copy"
fi

# Check if cfg directory is empty
if [ ! "$(ls -A /l4d2/left4dead2/cfg 2>/dev/null)" ]; then
    echo "Cfg directory is empty, copying configuration files..."
    if [ -d "/l4d2-backup/cfg" ]; then
        cp -r /l4d2-backup/cfg/* /l4d2/left4dead2/cfg/
        echo "Cfg configuration files copied"
    else
        echo "Warning: Backup cfg directory does not exist"
    fi
else
    echo "Cfg directory is not empty, skipping copy"
fi

# Control tick configuration file, environment variable L4D2_TICK
REAL_TICK=${L4D2_TICK:-30}  # Default value is 30
if [ "${L4D2_TICK}" = "60" ]; then
    echo "Setting tickrate to 60"
    cp /l4d2/left4dead2/cfg/server.cfg.60tick /l4d2/left4dead2/cfg/server.cfg
    REAL_TICK=60
elif [ "${L4D2_TICK}" = "100" ]; then
    echo "Setting tickrate to 100"
    cp /l4d2/left4dead2/cfg/server.cfg.100tick /l4d2/left4dead2/cfg/server.cfg
    REAL_TICK=100
else
    echo "Setting tickrate to 30"
    cp /l4d2/left4dead2/cfg/server.cfg.30tick /l4d2/left4dead2/cfg/server.cfg
fi

# Get RCON password from environment variable, write to server.cfg
if [ -n "${L4D2_RCON_PASSWORD}" ]; then
    echo "Setting RCON password..."
    sed -i "s/^rcon_password .*/rcon_password \"${L4D2_RCON_PASSWORD}\"/" /l4d2/left4dead2/cfg/server.cfg
else
    echo "Warning: RCON password not set, using default password"
    sed -i "s/^rcon_password .*/rcon_password \"laoyutangnb!\"/" /l4d2/left4dead2/cfg/server.cfg
fi

echo "File check and initialization complete, starting server..."

# Start L4D2 server
cd /l4d2 && ./srcds_run -game left4dead2 -insecure -tickrate "${REAL_TICK}" -condebug +hostport 27015 +exec server.cfg