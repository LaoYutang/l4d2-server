// 确认对话框系统
class ConfirmDialog {
  constructor() {
    this.overlay = document.getElementById('confirm-overlay');
    this.dialog = document.getElementById('confirm-dialog');
    this.titleElement = document.getElementById('confirm-title');
    this.messageElement = document.getElementById('confirm-message');
    this.yesButton = document.getElementById('confirm-yes');
    this.noButton = document.getElementById('confirm-no');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close(false);
      }
    });
  }

  show(message, title = '确认操作') {
    return new Promise((resolve) => {
      this.titleElement.textContent = title;
      this.messageElement.textContent = message;
      this.overlay.style.display = 'flex';

      setTimeout(() => {
        this.dialog.classList.add('show');
      }, 50);

      const handleYes = () => {
        this.close(true);
        resolve(true);
        cleanup();
      };

      const handleNo = () => {
        this.close(false);
        resolve(false);
        cleanup();
      };

      const cleanup = () => {
        this.yesButton.removeEventListener('click', handleYes);
        this.noButton.removeEventListener('click', handleNo);
      };

      this.yesButton.addEventListener('click', handleYes);
      this.noButton.addEventListener('click', handleNo);
    });
  }

  close(result) {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }
}

// RCON地图管理系统
class RconMapsDialog {
  constructor() {
    this.overlay = document.getElementById('rcon-maps-overlay');
    this.dialog = document.getElementById('rcon-maps-dialog');
    this.content = document.getElementById('rcon-maps-content');
    this.loading = document.getElementById('rcon-maps-loading');
    this.closeButton = document.getElementById('rcon-maps-close');
    this.hideOfficialMaps = false;
    this.allMaps = [];

    // 官方地图列表
    this.officialMaps = [
      'c14m1_junkyard',
      'c14m2_lighthouse',
      'c10m1_caves',
      'c10m2_drainage',
      'c10m3_ranchhouse',
      'c10m4_mainstreet',
      'c10m5_houseboat',
      'c11m1_greenhouse',
      'c11m2_offices',
      'c11m3_garage',
      'c11m4_terminal',
      'c11m5_runway',
      'c12m1_hilltop',
      'c12m2_traintunnel',
      'c12m3_bridge',
      'c12m4_barn',
      'c12m5_cornfield',
      'c13m1_alpinecreek',
      'c13m2_southpinestream',
      'c13m3_memorialbridge',
      'c13m4_cutthroatcreek',
      'c9m1_alleys',
      'c9m2_lots',
      'c7m1_docks',
      'c7m2_barge',
      'c7m3_port',
      'c8m1_apartment',
      'c8m2_subway',
      'c8m3_sewers',
      'c8m4_interior',
      'c8m5_rooftop',
      'c6m1_riverbank',
      'c6m2_bedlam',
      'c6m3_port',
      'c1m1_hotel',
      'c1m2_streets',
      'c1m3_mall',
      'c1m4_atrium',
      'c2m1_highway',
      'c2m2_fairgrounds',
      'c2m3_coaster',
      'c2m4_barns',
      'c2m5_concert',
      'c3m1_plankcountry',
      'c3m2_swamp',
      'c3m3_shantytown',
      'c3m4_plantation',
      'c4m1_milltown_a',
      'c4m2_sugarmill_a',
      'c4m3_sugarmill_b',
      'c4m4_milltown_b',
      'c4m5_milltown_escape',
      'c5m1_waterfront',
      'c5m1_waterfront_sndscape',
      'c5m2_park',
      'c5m3_cemetery',
      'c5m4_quarter',
      'c5m5_bridge',
      'credits',
      'curling_stadium',
      'motionprimingtest',
      'motionprimingtest_rev',
      'navigationtest_a',
      'styleguide_semiurban_01',
      'styleguide_swamp01',
      'styleguide_swamp_cheapwater01',
      'styleguide_urban_01',
      'test_box2',
      'test_macguffin',
      'test_mall',
      'test_scavenge',
      'tutorial_standards',
      'tutorial_standards_vs',
      'zoo_carnivalgames',
      'zoo_infected2',
      'zoo_jukebox',
      'zoo_swamp_foliage_01',
      'zoo_trafficsigns',
      'zoo_urban_foliage_01',
    ];

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.closeButton.addEventListener('click', () => {
      this.close();
    });
  }

  async show() {
    this.overlay.style.display = 'flex';
    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);

    await this.loadRconMaps();
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  async loadRconMaps() {
    this.showLoading();

    try {
      const response = await fetchServer('/rcon/maplist');
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const maps = await response.json();
      this.allMaps = maps; // 保存原始地图列表
      this.displayMaps(this.getFilteredMaps());
    } catch (error) {
      this.showError(error.message || error);
    }
  }

  getFilteredMaps() {
    if (this.hideOfficialMaps) {
      return this.allMaps.filter((map) => !this.officialMaps.includes(map));
    }
    return this.allMaps;
  }

  toggleOfficialMaps() {
    this.hideOfficialMaps = !this.hideOfficialMaps;
    this.displayMaps(this.getFilteredMaps());
  }

  showLoading() {
    this.content.innerHTML = `
      <div class="rcon-maps-loading">
        <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
        <div>加载地图列表中...</div>
      </div>
    `;
  }

  showError(message) {
    this.content.innerHTML = `
      <div class="rcon-maps-error">
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <div style="font-weight: 600; margin-bottom: 10px;">加载失败</div>
        <div>${message}</div>
        <button class="btn btn-primary" style="margin-top: 20px;" onclick="rconMapsDialog.loadRconMaps()">重试</button>
      </div>
    `;
  }

  displayMaps(maps) {
    if (this.allMaps.length === 0) {
      this.content.innerHTML = `
        <div class="rcon-maps-error">
          <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
          <div style="font-weight: 600; margin-bottom: 10px;">暂无地图</div>
          <div>服务器上没有找到任何地图</div>
        </div>
      `;
      return;
    }

    const officialCount = this.allMaps.filter((map) => this.officialMaps.includes(map)).length;
    const customCount = this.allMaps.length - officialCount;

    const mapsHtml = maps
      .map((mapName) => {
        const isOfficial = this.officialMaps.includes(mapName);
        return `
            <div class="rcon-map-item">
              <span class="rcon-map-name">
                ${isOfficial ? '🏛️' : '🗺️'} ${mapName}
                ${
                  isOfficial
                    ? '<span style="font-size: 12px; color: #999; margin-left: 8px;">(官方)</span>'
                    : ''
                }
              </span>
              <button class="btn-switch" onclick="changeMapHandler('${mapName}')">切换</button>
            </div>
          `;
      })
      .join('');

    this.content.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 12px; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="color: #667eea; font-weight: 600; font-size: 14px;">
            📊 地图统计：总共 ${
              this.allMaps.length
            } 个地图 (官方: ${officialCount}, 自定义: ${customCount})
          </div>
          <button onclick="rconMapsDialog.toggleOfficialMaps()" 
                  style="padding: 6px 12px; background: ${
                    this.hideOfficialMaps ? '#ff9a9e' : '#667eea'
                  }; 
                         color: white; border: none; border-radius: 6px; font-size: 12px; 
                         font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            ${this.hideOfficialMaps ? '显示官方地图' : '隐藏官方地图'}
          </button>
        </div>
        <div style="color: #666; font-size: 14px;">
          当前显示 ${maps.length} 个地图，点击切换按钮即可切换到对应地图
        </div>
      </div>
      ${mapsHtml}
    `;
  }
}

// 服务器状态管理系统
class ServerStatusDialog {
  constructor() {
    this.overlay = document.getElementById('status-overlay');
    this.dialog = document.getElementById('status-dialog');
    this.content = document.getElementById('status-content');
    this.loading = document.getElementById('status-loading');
    this.closeButton = document.getElementById('status-close');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.closeButton.addEventListener('click', () => {
      this.close();
    });
  }

  async show() {
    this.overlay.style.display = 'flex';
    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);

    await this.loadServerStatus();
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  async loadServerStatus() {
    this.showLoading();

    try {
      const response = await fetchServer('/rcon/getstatus');
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const statusData = await response.json();
      this.displayStatus(statusData);
    } catch (error) {
      this.showError(error.message || error);
    }
  }

  showLoading() {
    this.content.innerHTML = `
      <div class="status-loading">
        <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
        <div>获取服务器状态中...</div>
      </div>
    `;
  }

  showError(message) {
    this.content.innerHTML = `
      <div class="status-error">
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <div style="font-weight: 600; margin-bottom: 10px;">获取状态失败</div>
        <div>${message}</div>
      </div>
    `;
  }

  displayStatus(statusData) {
    // 处理状态数据并显示
    const parsedData = this.parseStatusData(statusData);

    // 创建属性框的HTML
    let propertiesHtml = '';

    // 基本服务器信息
    const basicInfo = ['Hostname', 'Map', 'Players'];
    let basicInfoHtml = '';
    basicInfo.forEach((key) => {
      const data = parsedData[key];
      if (data) {
        basicInfoHtml += `
          <div class="status-property-box">
            <div class="status-property-header">
              ${data.icon} ${data.label}
            </div>
            <div class="status-property-content">
              <div class="status-property-value">${data.value}</div>
            </div>
          </div>
        `;
      }
    });

    if (basicInfoHtml) {
      propertiesHtml += `
        <div class="basic-info-container">
          ${basicInfoHtml}
        </div>
      `;
    }

    // 用户列表框
    const usersData = parsedData.Users;
    if (usersData) {
      propertiesHtml += `
        <div class="status-property-box">
          <div class="status-property-header">
            👥 在线用户 (${usersData.users.length} 人)
          </div>
          <div class="status-property-content">
            ${
              usersData.users.length === 0
                ? '<div class="users-empty">🚫 当前无在线用户</div>'
                : `<div class="users-container">${usersData.users
                    .map((user, index) => this.createUserCard(user, index + 1))
                    .join('')}</div>`
            }
          </div>
        </div>
      `;
    }

    this.content.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 12px; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="color: #667eea; font-weight: 600; font-size: 14px; margin-bottom: 8px;">
          📊 服务器实时状态
        </div>
        <div style="color: #666; font-size: 12px;">
          最后更新时间: ${new Date().toLocaleString()}
        </div>
      </div>
      ${propertiesHtml}
    `;
  }

  createUserCard(user, userNumber) {
    const userName = user.name || user.Name || `用户${userNumber}`;
    const userInitial = userName.charAt(0).toUpperCase();

    return `
      <div class="user-card">
        <div class="user-header">
          <div class="user-avatar">${userInitial}</div>
          <div class="user-info">
            <div class="user-name">${userName}</div>
            <div class="user-id">#${user.id || user.Id || userNumber}</div>
          </div>
        </div>
        <div class="user-details">
          ${
            user.steamid || user.SteamId
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🆔 Steam</span>
              <span class="user-detail-value">${(user.steamid || user.SteamId).slice(-8)}</span>
            </div>
          `
              : ''
          }
          ${
            user.ip || user.Ip
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🌐 IP</span>
              <span class="user-detail-value">${(user.ip || user.Ip).split(':')[0]}</span>
            </div>
          `
              : ''
          }
          ${
            user.status || user.Status
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🎮 状态</span>
              <span class="user-detail-value">${this.formatUserStatus(
                user.status || user.Status
              )}</span>
            </div>
          `
              : ''
          }
          ${
            user.delay !== undefined || user.Delay !== undefined
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">📡 延迟</span>
              <span class="user-detail-value">${user.delay || user.Delay}ms</span>
            </div>
          `
              : ''
          }
          ${
            user.loss !== undefined || user.Loss !== undefined
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">📉 丢包</span>
              <span class="user-detail-value">${user.loss || user.Loss}%</span>
            </div>
          `
              : ''
          }
          ${
            user.duration || user.Duration
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">⏱️ 时长</span>
              <span class="user-detail-value">${user.duration || user.Duration}</span>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  parseStatusData(data) {
    const result = {};

    // 如果是字符串，尝试解析
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // 如果不是JSON，按行解析
        const lines = data.split('\n').filter((line) => line.trim());
        lines.forEach((line) => {
          if (line.includes(':')) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            const normalizedKey =
              key.trim().charAt(0).toUpperCase() + key.trim().slice(1).toLowerCase();
            result[normalizedKey] = {
              label: key.trim(),
              value: value,
              icon: '�',
            };
          }
        });
        return result;
      }
    }

    // 如果是对象，处理各个属性
    if (typeof data === 'object' && data !== null) {
      // 处理服务器名称
      if (data.hostname || data.Hostname) {
        result.Hostname = {
          label: '服务器名称',
          value: data.hostname || data.Hostname,
          icon: '🏠',
        };
      }

      // 处理地图
      if (data.map || data.Map) {
        result.Map = {
          label: '当前地图',
          value: data.map || data.Map,
          icon: '🗺️',
        };
      }

      // 处理玩家数
      if (data.players || data.Players) {
        result.Players = {
          label: '在线玩家',
          value: data.players || data.Players,
          icon: '👥',
        };
      }

      // 处理用户列表
      const users = data.users || data.Users;
      if (users && Array.isArray(users)) {
        result.Users = {
          label: '在线用户',
          users: users,
          icon: '👥',
        };
      }
    }

    return result;
  }

  // 格式化用户状态 (字符串格式)
  formatUserStatus(status) {
    if (typeof status === 'string') {
      const statusNames = {
        active: '🎮 活跃',
        idle: '😴 空闲',
        dead: '💀 死亡',
        spectator: '👀 观察',
        connecting: '🔄 连接中',
        disconnected: '❌ 已断开',
      };
      return statusNames[status.toLowerCase()] || `🔧 ${status}`;
    }
    return status;
  }

  // 格式化连接速率
  formatLinkRate(rate) {
    if (typeof rate !== 'number') return rate;

    if (rate >= 1000000) {
      return `${(rate / 1000000).toFixed(1)}Mbps`;
    } else if (rate >= 1000) {
      return `${(rate / 1000).toFixed(1)}Kbps`;
    } else {
      return `${rate}bps`;
    }
  }
}

// 地图管理弹框系统
class MapManagementDialog {
  constructor() {
    this.overlay = document.getElementById('map-management-overlay');
    this.dialog = document.getElementById('map-management-dialog');
    this.closeButton = document.getElementById('map-management-close');

    // 绑定关闭事件
    this.closeButton.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.style.display === 'flex') {
        this.close();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);

    // 刷新地图列表 - 延迟执行确保弹框已经显示
    setTimeout(() => {
      if (window.updateList) {
        window.updateList();
      }
    }, 100);
  }

  close() {
    this.dialog.classList.remove('show');
    document.body.style.overflow = '';

    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }
}
