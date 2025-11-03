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
      {
        Title: 'Dead Center',
        Chapters: [
          { Code: 'c1m1_hotel', Title: 'Hotel', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c1m2_streets', Title: 'Streets', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c1m3_mall', Title: 'Mall', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c1m4_atrium', Title: 'Atrium', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Dark Carnival',
        Chapters: [
          { Code: 'c2m1_highway', Title: 'Highway', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c2m2_fairgrounds', Title: 'Fairgrounds', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c2m3_coaster', Title: 'Coaster', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c2m4_barns', Title: 'Barns', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c2m5_concert', Title: 'Concert', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Swamp Fever',
        Chapters: [
          {
            Code: 'c3m1_plankcountry',
            Title: 'Plank Country',
            Modes: ['coop', 'realism', 'versus'],
          },
          { Code: 'c3m2_swamp', Title: 'Swamp', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c3m3_shantytown', Title: 'Shantytown', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c3m4_plantation', Title: 'Plantation', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Hard Rain',
        Chapters: [
          { Code: 'c4m1_milltown_a', Title: 'Milltown A', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c4m2_sugarmill_a', Title: 'Sugar Mill A', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c4m3_sugarmill_b', Title: 'Sugar Mill B', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c4m4_milltown_b', Title: 'Milltown B', Modes: ['coop', 'realism', 'versus'] },
          {
            Code: 'c4m5_milltown_escape',
            Title: 'Milltown Escape',
            Modes: ['coop', 'realism', 'versus'],
          },
        ],
      },
      {
        Title: 'The Parish',
        Chapters: [
          { Code: 'c5m1_waterfront', Title: 'Waterfront', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c5m2_park', Title: 'Park', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c5m3_cemetery', Title: 'Cemetery', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c5m4_quarter', Title: 'Quarter', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c5m5_bridge', Title: 'Bridge', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'The Passing',
        Chapters: [
          { Code: 'c6m1_riverbank', Title: 'Riverbank', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c6m2_bedlam', Title: 'Bedlam', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c6m3_port', Title: 'Port', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'The Sacrifice',
        Chapters: [
          { Code: 'c7m1_docks', Title: 'Docks', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c7m2_barge', Title: 'Barge', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c7m3_port', Title: 'Port', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'No Mercy',
        Chapters: [
          { Code: 'c8m1_apartment', Title: 'Apartment', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c8m2_subway', Title: 'Subway', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c8m3_sewers', Title: 'Sewers', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c8m4_interior', Title: 'Hospital', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c8m5_rooftop', Title: 'Rooftop', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Crash Course',
        Chapters: [
          { Code: 'c9m1_alleys', Title: 'Alleys', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c9m2_lots', Title: 'Lots', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Death Toll',
        Chapters: [
          { Code: 'c10m1_caves', Title: 'Caves', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c10m2_drainage', Title: 'Drainage', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c10m3_ranchhouse', Title: 'Ranchhouse', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c10m4_mainstreet', Title: 'Main Street', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c10m5_houseboat', Title: 'Houseboat', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Dead Air',
        Chapters: [
          { Code: 'c11m1_greenhouse', Title: 'Greenhouse', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c11m2_offices', Title: 'Offices', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c11m3_garage', Title: 'Garage', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c11m4_terminal', Title: 'Terminal', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c11m5_runway', Title: 'Runway', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Blood Harvest',
        Chapters: [
          { Code: 'c12m1_hilltop', Title: 'Hilltop', Modes: ['coop', 'realism', 'versus'] },
          {
            Code: 'c12m2_traintunnel',
            Title: 'Train Tunnel',
            Modes: ['coop', 'realism', 'versus'],
          },
          { Code: 'c12m3_bridge', Title: 'Bridge', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c12m4_barn', Title: 'Barn', Modes: ['coop', 'realism', 'versus'] },
          { Code: 'c12m5_cornfield', Title: 'Cornfield', Modes: ['coop', 'realism', 'versus'] },
        ],
      },
      {
        Title: 'Cold Stream',
        Chapters: [
          {
            Code: 'c13m1_alpinecreek',
            Title: 'Alpine Creek',
            Modes: ['coop', 'realism', 'versus'],
          },
          {
            Code: 'c13m2_southpinestream',
            Title: 'South Pine Stream',
            Modes: ['coop', 'realism', 'versus'],
          },
          {
            Code: 'c13m3_memorialbridge',
            Title: 'Memorial Bridge',
            Modes: ['coop', 'realism', 'versus'],
          },
          {
            Code: 'c13m4_cutthroatcreek',
            Title: 'Cutthroat Creek',
            Modes: ['coop', 'realism', 'versus'],
          },
        ],
      },
      {
        Title: 'The Last Stand',
        Chapters: [
          { Code: 'c14m1_junkyard', Title: 'Junkyard', Modes: ['coop', 'realism', 'survival'] },
          { Code: 'c14m2_lighthouse', Title: 'Lighthouse', Modes: ['coop', 'realism', 'survival'] },
        ],
      },
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

      const serverMaps = await response.json();

      // 将服务器地图和官方地图合并为统一格式
      this.allMaps = this.mergeMapData(serverMaps);
      this.displayMaps(this.getFilteredMaps());
    } catch (error) {
      this.showError(error.message || error);
    }
  }

  mergeMapData(serverMaps) {
    // 创建包含官方地图的数组，标记为非自定义
    const allMaps = this.officialMaps.map((officialMap) => ({
      ...officialMap,
      IsCustom: false,
    }));

    // 处理服务器返回的地图数据
    if (Array.isArray(serverMaps)) {
      // 服务器返回的是 Campaign 数组格式
      serverMaps.forEach((serverCampaign) => {
        // 检查是否是官方地图（通过对比章节代码）
        const isOfficialCampaign = this.officialMaps.some(
          (officialMap) =>
            officialMap.Chapters &&
            serverCampaign.Chapters &&
            serverCampaign.Chapters.some((serverChapter) =>
              officialMap.Chapters.some(
                (officialChapter) => officialChapter.Code === serverChapter.Code
              )
            )
        );

        if (!isOfficialCampaign) {
          // 添加自定义地图
          allMaps.push({
            Title: serverCampaign.Title || '未知战役',
            Chapters: serverCampaign.Chapters || [],
            IsCustom: true,
          });
        }
      });
    } else if (typeof serverMaps === 'object' && serverMaps !== null) {
      // 如果服务器返回的是包装在对象中的数据
      if (Array.isArray(serverMaps.campaigns)) {
        serverMaps.campaigns.forEach((campaign) => {
          allMaps.push({
            Title: campaign.Title || '未知战役',
            Chapters: campaign.Chapters || [],
            IsCustom: true,
          });
        });
      }
    }

    return allMaps;
  }

  getFilteredMaps() {
    if (this.hideOfficialMaps) {
      return this.allMaps.filter((map) => map.IsCustom);
    }
    return this.allMaps;
  }

  formatGameModes(modes) {
    if (!modes || modes.length === 0) {
      return '<span style="color: #999;">未知</span>';
    }

    const modeMapping = {
      coop: '战役模式',
      realism: '写实模式',
      versus: '对抗模式',
      survival: '生存模式',
      scavenge: '清道夫模式',
      halftank: '坦克模式',
      brawler: '格斗模式',
    };

    const formattedModes = modes
      .map((mode) => {
        const displayName = modeMapping[mode] || mode;
        return `<span class="mode-badge mode-${mode}">${displayName}</span>`;
      })
      .join(' ');

    return formattedModes;
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

    const officialCount = this.allMaps.filter((map) => !map.IsCustom).length;
    const customCount = this.allMaps.filter((map) => map.IsCustom).length;

    const mapsHtml = maps
      .map((campaign) => {
        const isOfficial = !campaign.IsCustom;
        const campaignIcon = isOfficial ? '🏛️' : '🗺️';
        const campaignTitle = String(campaign.Title || '未知战役');
        const campaignId = `campaign-${campaignTitle.replace(/[^a-zA-Z0-9]/g, '-')}`;

        const chaptersHtml = (campaign.Chapters || [])
          .map((chapter) => {
            // 处理游戏模式显示
            const modes = chapter.Modes || [];
            const modeText = modes.length > 0 ? modes.join(', ') : '未知';
            const modeDisplayText = this.formatGameModes(modes);

            return `
          <div class="rcon-chapter-item">
            <div class="rcon-chapter-info">
              <span class="rcon-chapter-name">${String(
                chapter.Title || chapter.Code || '未知章节'
              )}</span>
              <div class="rcon-chapter-modes">
                <span class="mode-label">🎮 支持模式:</span>
                <span class="mode-text">${modeDisplayText}</span>
              </div>
            </div>
            <button class="btn-switch" onclick="changeMapHandler('${String(
              chapter.Code || ''
            )}')">切换</button>
          </div>
        `;
          })
          .join('');

        return `
          <div class="rcon-campaign-item">
            <div class="rcon-campaign-header" onclick="rconMapsDialog.toggleCampaign('${campaignId}')">
              <span class="rcon-campaign-toggle" id="${campaignId}-toggle">▶</span>
              <span class="rcon-campaign-name">
                ${campaignIcon} ${campaignTitle}
                ${
                  isOfficial
                    ? '<span class="official-badge">(官方)</span>'
                    : '<span class="custom-badge">(自定义)</span>'
                }
              </span>
              <span class="rcon-chapter-count">${(campaign.Chapters || []).length} 章节</span>
            </div>
            <div class="rcon-chapters-container" id="${campaignId}-chapters" style="display: none;">
              ${chaptersHtml}
            </div>
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
            } 个战役 (官方: ${officialCount}, 自定义: ${customCount})
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
          当前显示 ${
            maps.length
          } 个战役，点击切换按钮切换到对应章节，如果切换失败请检查是否已经重启服务器，如果仍然失败请联系管理员排查问题。
        </div>
      </div>
      ${mapsHtml}
    `;
  }

  toggleCampaign(campaignId) {
    const chaptersContainer = document.getElementById(`${campaignId}-chapters`);
    const toggleIcon = document.getElementById(`${campaignId}-toggle`);

    if (chaptersContainer && toggleIcon) {
      const isExpanded = chaptersContainer.style.display !== 'none';

      if (isExpanded) {
        chaptersContainer.style.display = 'none';
        toggleIcon.textContent = '▶';
      } else {
        chaptersContainer.style.display = 'block';
        toggleIcon.textContent = '▼';
      }
    }
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
    const basicInfo = ['Hostname', 'Map', 'GameMode', 'Difficulty', 'Players'];
    let basicInfoHtml = '';
    basicInfo.forEach((key) => {
      const data = parsedData[key];
      if (data) {
        // 特殊处理难度和模式，添加更改按钮
        if (key === 'Difficulty') {
          basicInfoHtml += `
            <div class="status-property-box">
              <div class="status-property-header">
                ${data.icon} ${data.label}
              </div>
              <div class="status-property-content">
                <div class="status-property-value-with-button">
                  <span class="status-property-value">${data.value}</span>
                  <button class="difficulty-change-btn" onclick="showDifficultyChangeDialog()" title="更改难度">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          `;
        } else if (key === 'GameMode') {
          basicInfoHtml += `
            <div class="status-property-box">
              <div class="status-property-header">
                ${data.icon} ${data.label}
              </div>
              <div class="status-property-content">
                <div class="status-property-value-with-button">
                  <span class="status-property-value">${data.value}</span>
                  <button class="difficulty-change-btn" onclick="showGameModeChangeDialog()" title="更改模式">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
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
      const userCount = usersData.users.length;
      const singleUserClass = userCount === 1 ? ' single-user' : '';

      propertiesHtml += `
        <div class="status-property-box">
          <div class="status-property-header">
            👥 在线用户 (${userCount} 人)
          </div>
          <div class="status-property-content">
            ${
              userCount === 0
                ? '<div class="users-empty">🚫 当前无在线用户</div>'
                : `<div class="users-container${singleUserClass}">${usersData.users
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
    const userId = user.id || user.Id || userNumber;

    return `
      <div class="user-card">
        <div class="user-header">
          <div class="user-left">
            <div class="user-avatar">${userInitial}</div>
            <div class="user-info">
              <div class="user-name">${userName}</div>
              <div class="user-id">#${userId}</div>
            </div>
          </div>
          <div class="user-actions">
            <button class="user-playtime-btn" onclick="getUserPlaytime('${userName}', '${
      user.steamid || user.SteamId || ''
    }')" title="获取游戏时长" ${!(user.steamid || user.SteamId) ? 'disabled' : ''}>
              ⏱️
            </button>
            <button class="user-kick-btn" onclick="kickUser('${userName}', ${userId})" title="踢出玩家">
              🥾
            </button>
          </div>
        </div>
        <div class="user-details">
          ${
            user.steamid || user.SteamId
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🆔 Steam</span>
              <span class="user-detail-value steamid" title="${
                user.steamid || user.SteamId
              }">${this.formatSteamId(user.steamid || user.SteamId)}</span>
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
          ${
            user.linkrate !== undefined || user.LinkRate !== undefined
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🔗 连接速率</span>
              <span class="user-detail-value">${this.formatLinkRate(
                user.linkrate || user.LinkRate
              )}</span>
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
              icon: '���',
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

      // 处理游戏模式
      if (data.gameMode || data.GameMode) {
        result.GameMode = {
          label: '游戏模式',
          value: data.gameMode || data.GameMode,
          icon: '🎮',
        };
      }

      // 处理难度
      if (data.difficulty || data.Difficulty) {
        result.Difficulty = {
          label: '游戏难度',
          value: data.difficulty || data.Difficulty,
          icon: '⚔️',
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

  // 格式化SteamID显示
  formatSteamId(steamId) {
    if (!steamId) return '';

    const steamIdStr = String(steamId);

    // 如果是标准的Steam64ID (17位数字)
    if (steamIdStr.length === 17 && /^\d+$/.test(steamIdStr)) {
      return `${steamIdStr.slice(0, 5)}...${steamIdStr.slice(-8)}`;
    }

    // 如果SteamID太长，显示前4位...后8位的格式
    if (steamIdStr.length > 12) {
      return `${steamIdStr.slice(0, 4)}...${steamIdStr.slice(-8)}`;
    }

    // 如果不太长，直接显示
    return steamIdStr;
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
      // 重新设置筛选功能
      if (window.setupMapFilter) {
        window.setupMapFilter();
      }
      // 重新设置拖拽功能
      if (window.setupDragAndDrop) {
        window.setupDragAndDrop();
      }
    }, 100);
  }

  close() {
    this.dialog.classList.remove('show');
    document.body.style.overflow = '';

    // 重置筛选状态
    const filterInput = document.getElementById('map-filter');
    const clearFilterBtn = document.getElementById('clear-filter');
    if (filterInput) {
      filterInput.value = '';
    }
    if (clearFilterBtn) {
      clearFilterBtn.classList.remove('visible');
    }

    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }
}

// 主页面服务器状态管理系统
class MainServerStatus {
  constructor() {
    this.content = document.getElementById('server-status-content');
    this.loading = document.getElementById('server-status-loading');
    this.miniLoading = document.getElementById('server-status-mini-loading');
    this.titleUpdated = false; // 用于标记是否已经更新过页面标题
    this.hasContent = false; // 用于标记是否已经有内容显示
  }

  async loadServerStatus() {
    this.showMiniLoading();

    try {
      // 主页面的服务器状态不需要密码验证，直接调用API
      const response = await fetch('/rcon/getstatus', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const statusData = await response.json();

      // 如果是第一次成功获取状态，尝试更新页面标题
      if (!this.titleUpdated) {
        this.updatePageTitle(statusData);
      }

      this.displayStatus(statusData);
      this.hasContent = true;
    } catch (error) {
      this.showError(error.message || error);
    } finally {
      this.hideMiniLoading();
    }
  }

  updatePageTitle(statusData) {
    try {
      if (typeof statusData === 'object' && statusData !== null) {
        const serverName = statusData.Hostname;
        if (serverName && serverName.trim()) {
          document.title = serverName.trim();
          this.titleUpdated = true;
        }
      }
    } catch (error) {
      console.warn('更新页面标题时出错:', error);
    }
  }

  // 显示小loading指示器
  showMiniLoading() {
    if (this.miniLoading) {
      this.miniLoading.style.display = 'flex';
    }

    // 如果还没有内容，显示原来的大loading
    if (!this.hasContent) {
      this.showLoading();
    }
  }

  // 隐藏小loading指示器
  hideMiniLoading() {
    if (this.miniLoading) {
      this.miniLoading.style.display = 'none';
    }
  }

  showLoading() {
    this.content.innerHTML = `
      <div class="server-status-loading">
        <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
        <div>获取服务器状态中...</div>
      </div>
    `;
  }

  showError(message) {
    this.content.innerHTML = `
      <div class="server-status-error">
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <div style="font-weight: 600; margin-bottom: 10px;">获取状态失败</div>
        <div>${message}</div>
      </div>
    `;
  }

  displayStatus(statusData) {
    // 复用 ServerStatusDialog 的解析和显示逻辑
    const serverStatusDialog = window.serverStatusDialog;
    if (!serverStatusDialog) {
      this.showError('系统初始化错误');
      return;
    }

    // 处理状态数据并显示
    const parsedData = serverStatusDialog.parseStatusData(statusData);

    // 创建属性框的HTML
    let propertiesHtml = '';

    // 基本服务器信息
    const basicInfo = ['Hostname', 'Map', 'GameMode', 'Difficulty', 'Players'];
    let basicInfoHtml = '';
    basicInfo.forEach((key) => {
      const data = parsedData[key];
      if (data) {
        // 特殊处理难度和模式，添加更改按钮
        if (key === 'Difficulty') {
          basicInfoHtml += `
            <div class="status-property-box">
              <div class="status-property-header">
                ${data.icon} ${data.label}
              </div>
              <div class="status-property-content">
                <div class="status-property-value-with-button">
                  <span class="status-property-value">${data.value}</span>
                  <button class="difficulty-change-btn" onclick="showDifficultyChangeDialog()" title="更改难度">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          `;
        } else if (key === 'GameMode') {
          basicInfoHtml += `
            <div class="status-property-box">
              <div class="status-property-header">
                ${data.icon} ${data.label}
              </div>
              <div class="status-property-content">
                <div class="status-property-value-with-button">
                  <span class="status-property-value">${data.value}</span>
                  <button class="difficulty-change-btn" onclick="showGameModeChangeDialog()" title="更改模式">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
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
      const userCount = usersData.users.length;
      const singleUserClass = userCount === 1 ? ' single-user' : '';

      propertiesHtml += `
        <div class="status-property-box">
          <div class="status-property-header">
            👥 在线用户 (${userCount} 人)
          </div>
          <div class="status-property-content">
            ${
              userCount === 0
                ? '<div class="users-empty">🚫 当前无在线用户</div>'
                : `<div class="users-container${singleUserClass}">${usersData.users
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
    // 复用 ServerStatusDialog 的 createUserCard 方法
    const serverStatusDialog = window.serverStatusDialog;
    if (serverStatusDialog && typeof serverStatusDialog.createUserCard === 'function') {
      return serverStatusDialog.createUserCard(user, userNumber);
    }

    // 如果没有可用的方法，使用简化版本
    const userName = user.name || user.Name || `用户${userNumber}`;
    const userInitial = userName.charAt(0).toUpperCase();
    const userId = user.id || user.Id || userNumber;

    return `
      <div class="user-card">
        <div class="user-header">
          <div class="user-left">
            <div class="user-avatar">${userInitial}</div>
            <div class="user-info">
              <div class="user-name">${userName}</div>
              <div class="user-id">#${userId}</div>
            </div>
          </div>
          <div class="user-actions">
            <button class="user-playtime-btn" onclick="getUserPlaytime('${userName}', '${
      user.steamid || user.SteamId || ''
    }')" title="获取游戏时长" ${!(user.steamid || user.SteamId) ? 'disabled' : ''}>
              ⏱️
            </button>
            <button class="user-kick-btn" onclick="kickUser('${userName}', ${userId})" title="踢出玩家">
              🥾
            </button>
          </div>
        </div>
        <div class="user-details">
          ${
            user.steamid || user.SteamId
              ? `
            <div class="user-detail-item">
              <span class="user-detail-label">🆔 Steam</span>
              <span class="user-detail-value steamid" title="${
                user.steamid || user.SteamId
              }">${this.formatSteamId(user.steamid || user.SteamId)}</span>
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
        </div>
      </div>
    `;
  }

  formatSteamId(steamId) {
    // 复用 ServerStatusDialog 的 formatSteamId 方法
    const serverStatusDialog = window.serverStatusDialog;
    if (serverStatusDialog && typeof serverStatusDialog.formatSteamId === 'function') {
      return serverStatusDialog.formatSteamId(steamId);
    }

    // 如果没有可用的方法，使用简化版本
    if (!steamId) return '';

    const steamIdStr = String(steamId);
    if (steamIdStr.length > 12) {
      return `${steamIdStr.slice(0, 4)}...${steamIdStr.slice(-8)}`;
    }
    return steamIdStr;
  }
}

// 授权码管理弹框
class AuthCodeDialog {
  constructor() {
    this.overlay = document.getElementById('auth-code-overlay');
    this.dialog = document.getElementById('auth-code-dialog');
    this.closeButton = document.getElementById('auth-code-close');
    this.expiredSelect = document.getElementById('auth-code-expired');
    this.generateButton = document.getElementById('generate-auth-code');
    this.resultSection = document.getElementById('auth-code-result');
    this.tokenInput = document.getElementById('auth-code-token');
    this.copyButton = document.getElementById('copy-auth-code');
    this.expiresSpan = document.getElementById('auth-code-expires');

    this.initEventListeners();
  }

  initEventListeners() {
    // 关闭按钮
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 生成授权码按钮
    this.generateButton.addEventListener('click', () => {
      this.generateAuthCode();
    });

    // 复制按钮
    this.copyButton.addEventListener('click', () => {
      this.copyAuthCode();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';
    this.resultSection.style.display = 'none';
    this.expiredSelect.value = '1'; // 重置为默认值

    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }

  async generateAuthCode() {
    const expired = this.expiredSelect.value;

    if (!serverAPI.password) {
      showError('请先输入管理密码！');
      return;
    }

    this.generateButton.disabled = true;
    this.generateButton.textContent = '🔄 生成中...';

    try {
      const formData = new FormData();
      formData.append('password', serverAPI.password);
      formData.append('expired', expired);

      const response = await fetch('/auth/getTempAuthCode', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const token = await response.text();
        this.showAuthCodeResult(token, expired);
        showNotification('授权码生成成功！');
      } else {
        const errorText = await response.text();
        showError(`生成授权码失败: ${errorText}`);
      }
    } catch (error) {
      showError(`生成授权码失败: ${error.message}`);
    } finally {
      this.generateButton.disabled = false;
      this.generateButton.textContent = '🔑 生成授权码';
    }
  }

  showAuthCodeResult(token, expired) {
    this.tokenInput.value = token;

    // 计算过期时间
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + parseInt(expired));
    this.expiresSpan.textContent = expiryDate.toLocaleString();

    this.resultSection.style.display = 'block';
  }

  async copyAuthCode() {
    try {
      await navigator.clipboard.writeText(this.tokenInput.value);

      // 临时改变按钮文本
      const originalText = this.copyButton.textContent;
      this.copyButton.textContent = '✅ 已复制';
      this.copyButton.style.background = 'linear-gradient(135deg, #28a745, #20c997)';

      setTimeout(() => {
        this.copyButton.textContent = originalText;
        this.copyButton.style.background = '';
      }, 2000);

      showNotification('授权码已复制到剪贴板！');
    } catch (error) {
      // 如果剪贴板API不可用，使用传统方法
      this.tokenInput.select();
      this.tokenInput.setSelectionRange(0, 99999);
      document.execCommand('copy');
      showNotification('授权码已复制到剪贴板！');
    }
  }
}

// 下载任务管理弹框系统
class DownloadManagementDialog {
  constructor() {
    this.overlay = document.getElementById('download-management-overlay');
    this.dialog = document.getElementById('download-management-dialog');
    this.closeButton = document.getElementById('download-management-close');
    this.urlInput = document.getElementById('download-url');
    this.addTaskButton = document.getElementById('add-download-task');
    this.refreshButton = document.getElementById('refresh-download-tasks');
    this.clearButton = document.getElementById('clear-download-tasks');
    this.tasksList = document.getElementById('download-tasks-list');
    this.tasksLoading = document.getElementById('download-tasks-loading');

    this.tasks = [];
    this.refreshInterval = null;

    this.init();
  }

  init() {
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

    // 绑定按钮事件
    this.addTaskButton.addEventListener('click', () => this.addDownloadTask());
    this.refreshButton.addEventListener('click', () => this.refreshTasks());
    this.clearButton.addEventListener('click', () => this.clearAllTasks());

    // URL输入框快捷键
    this.urlInput.addEventListener('keydown', (e) => {
      // Ctrl+Enter 或 Cmd+Enter 提交任务
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.addDownloadTask();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);

    // 加载任务列表
    this.refreshTasks();

    // 启动自动刷新功能，用于实时更新下载速度
    this.startAutoRefresh();
  }

  close() {
    this.dialog.classList.remove('show');
    document.body.style.overflow = '';

    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);

    // 停止定时刷新
    this.stopAutoRefresh();

    // 清空输入框
    this.urlInput.value = '';
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.refreshTasks(true); // 静默刷新
    }, 2000); // 每2秒刷新一次
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async addDownloadTask() {
    const urlText = this.urlInput.value.trim();

    if (!urlText) {
      showError('请输入下载链接');
      return;
    }

    // 使用正则表达式提取所有http/https链接
    const urlRegex = /(https?:\/\/[^\s\n\r]+)/g;
    const urls = urlText.match(urlRegex) || [];

    if (urls.length === 0) {
      showError('请输入有效的 HTTP 或 HTTPS 链接');
      return;
    }

    // 验证每个URL的格式
    const invalidUrls = [];
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          invalidUrls.push(url);
        }
      } catch (e) {
        invalidUrls.push(url);
      }
    }

    if (invalidUrls.length > 0) {
      showError(
        `以下链接格式无效：\n${invalidUrls.slice(0, 3).join('\n')}${
          invalidUrls.length > 3 ? '\n...' : ''
        }`
      );
      return;
    }

    try {
      // 将所有链接作为一个字符串发送给后端，后端会自动分割处理
      const response = await serverAPI.addDownloadTask(urlText);

      if (response.success) {
        showNotification(`成功添加 ${urls.length} 个下载任务！`);
        this.urlInput.value = '';
        this.refreshTasks();
      } else {
        showError(response.message || '添加下载任务失败');
      }
    } catch (error) {
      showError('添加下载任务失败: ' + error.message);
    }
  }

  async refreshTasks(silent = false) {
    if (!silent) {
      this.showLoading();
    }

    try {
      const response = await serverAPI.getDownloadTasks();

      if (response.success) {
        this.tasks = response.data || [];
        this.renderTasks();
      } else {
        if (!silent) {
          showError(response.message || '获取任务列表失败');
        }
        this.showError('获取任务列表失败');
      }
    } catch (error) {
      if (!silent) {
        showError('获取任务列表失败: ' + error.message);
      }
      this.showError('获取任务列表失败');
    }
  }

  async clearAllTasks() {
    const confirmed = await confirmAction(
      '清空已完成任务',
      '您确定要清空已完成下载任务吗？正在进行中的任务将保留。',
      '清空',
      '取消'
    );

    if (!confirmed) return;

    try {
      const response = await serverAPI.clearDownloadTasks();

      if (response.success) {
        showNotification('已清空完成任务！');
        this.refreshTasks();
      } else {
        showError(response.message || '清空任务失败');
      }
    } catch (error) {
      showError('清空任务失败: ' + error.message);
    }
  }

  async cancelTask(index) {
    const confirmed = await confirmAction(
      '取消下载任务',
      '您确定要取消这个下载任务吗？',
      '取消任务',
      '保留任务'
    );

    if (!confirmed) return;

    try {
      const response = await serverAPI.cancelDownloadTask(index);

      if (response.success) {
        showNotification('下载任务已取消！');
        this.refreshTasks();
      } else {
        showError(response.message || '取消任务失败');
      }
    } catch (error) {
      showError('取消任务失败: ' + error.message);
    }
  }

  async restartTask(index) {
    const confirmed = await confirmAction(
      '重新下载任务',
      '您确定要重新下载这个任务吗？当前任务将被取消并重新开始。',
      '重新下载',
      '取消'
    );

    if (!confirmed) return;

    try {
      const response = await serverAPI.restartDownloadTask(index);

      if (response.success) {
        showNotification('下载任务已重新开始！');
        this.refreshTasks();
      } else {
        showError(response.message || '重新下载失败');
      }
    } catch (error) {
      showError('重新下载失败: ' + error.message);
    }
  }

  showLoading() {
    this.tasksLoading.style.display = 'flex';
    this.tasksList.innerHTML = '';
  }

  showError(message) {
    this.tasksLoading.style.display = 'none';
    this.tasksList.innerHTML = `
      <div class="download-tasks-empty">
        <div class="icon">❌</div>
        <div>${message}</div>
      </div>
    `;
  }

  renderTasks() {
    this.tasksLoading.style.display = 'none';

    if (this.tasks.length === 0) {
      this.tasksList.innerHTML = `
        <div class="download-tasks-empty">
          <div class="icon">📥</div>
          <div>暂无下载任务</div>
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            在上方输入下载链接添加任务
          </div>
        </div>
      `;
      return;
    }

    const tasksHtml = this.tasks.map((task, index) => this.renderTaskItem(task, index)).join('');
    this.tasksList.innerHTML = tasksHtml;
  }

  renderTaskItem(task, index) {
    const statusClass = this.getStatusClass(task.status);
    const statusText = this.getStatusText(task.status);
    const progress = task.progress || 0;
    const message = task.message || '';
    const url = task.url || '未知链接';
    const fileSize = task.formattedSize || '';

    return `
      <div class="download-task-item">
        <div class="download-task-header">
          <div class="download-task-url" title="${this.getDisplayUrl(url)}">${this.truncateUrl(
      url
    )}</div>
          <div class="download-task-status-wrapper">
            <div class="download-task-status ${statusClass}">${statusText}</div>
            <div class="download-task-actions">
              ${
                task.status === 0 || task.status === 1 // 等待中或下载中状态显示取消按钮
                  ? `<button class="download-task-cancel-btn" onclick="downloadManagementDialog.cancelTask(${index})" title="取消下载">❌</button>`
                  : ''
              }
              ${
                task.status === 1 || task.status === 3 // 下载中或失败状态显示重新下载按钮
                  ? `<button class="download-task-restart-btn" onclick="downloadManagementDialog.restartTask(${index})" title="重新下载">🔄</button>`
                  : ''
              }
            </div>
          </div>
        </div>
        
        ${
          task.status === 1
            ? `
          <div class="download-task-progress">
            <div class="download-progress-bar">
              <div class="download-progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
        `
            : ''
        }
        
        <div class="download-task-info">
          <div>
            ${task.status === 1 ? `${progress.toFixed(1)}%` : ''}
            ${
              fileSize
                ? `<span style="color: #666; font-size: 11px; ${
                    task.status === 1 ? 'margin-left: 8px;' : ''
                  }">文件大小: ${fileSize}</span>`
                : ''
            }
            ${
              message
                ? `<span style="color: #999; font-size: 11px; ${
                    fileSize || task.status === 1 ? 'margin-left: 8px;' : ''
                  }">${message}</span>`
                : ''
            }
          </div>
          ${
            task.status === 1 && task.formattedSpeed
              ? `<div class="download-task-speed">${task.formattedSpeed}</div>`
              : ''
          }
        </div>
      </div>
    `;
  }

  getDisplayUrl(url) {
    try {
      // 对完整URL进行解码，用于title显示
      return decodeURIComponent(url);
    } catch (error) {
      // 如果解码失败，返回原始URL
      return url;
    }
  }

  truncateUrl(url, maxLength = 60) {
    try {
      // 尝试从URL中提取文件名
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 获取路径中的最后一部分作为文件名
      let filename = pathname.split('/').pop();

      // 如果没有文件名或文件名为空，使用完整URL
      if (!filename || filename === '') {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
      }

      // 对文件名进行URI解码
      filename = decodeURIComponent(filename);

      // 如果解码后的文件名过长，则截断
      if (filename.length > maxLength) {
        return filename.substring(0, maxLength - 3) + '...';
      }

      return filename;
    } catch (error) {
      // 如果URL解析失败，使用原来的截断逻辑
      if (url.length <= maxLength) return url;
      return url.substring(0, maxLength - 3) + '...';
    }
  }

  getStatusClass(status) {
    const statusMap = {
      0: 'pending', // DOWNLOAD_STATUS_PENDING
      1: 'downloading', // DOWNLOAD_STATUS_IN_PROGRESS
      2: 'completed', // DOWNLOAD_STATUS_COMPLETED
      3: 'failed', // DOWNLOAD_STATUS_FAILED
    };
    return statusMap[status] || 'pending';
  }

  getStatusText(status) {
    const statusMap = {
      0: '等待中', // DOWNLOAD_STATUS_PENDING
      1: '下载中', // DOWNLOAD_STATUS_IN_PROGRESS
      2: '已完成', // DOWNLOAD_STATUS_COMPLETED
      3: '失败', // DOWNLOAD_STATUS_FAILED
    };
    return statusMap[status] || '未知';
  }
}

// 难度更改弹框
class DifficultyChangeDialog {
  constructor() {
    this.overlay = document.getElementById('difficulty-change-overlay');
    this.dialog = document.getElementById('difficulty-change-dialog');
    this.closeButton = document.getElementById('difficulty-change-close');
    this.confirmButton = document.getElementById('change-difficulty-confirm');
    this.selectedDifficulty = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 关闭按钮
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 难度选项点击
    const difficultyOptions = document.querySelectorAll('.difficulty-option');
    difficultyOptions.forEach((option) => {
      option.addEventListener('click', () => {
        this.selectDifficulty(option);
      });
    });

    // 确认按钮
    this.confirmButton.addEventListener('click', () => {
      this.changeDifficulty();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';
    this.selectedDifficulty = null;
    this.confirmButton.disabled = true;

    // 清除之前的选择
    document.querySelectorAll('.difficulty-option').forEach((option) => {
      option.classList.remove('selected');
    });

    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }

  selectDifficulty(option) {
    // 清除之前的选择
    document.querySelectorAll('.difficulty-option').forEach((opt) => {
      opt.classList.remove('selected');
    });

    // 选择当前选项
    option.classList.add('selected');
    this.selectedDifficulty = option.dataset.difficulty;
    this.confirmButton.disabled = false;
  }

  async changeDifficulty() {
    if (!this.selectedDifficulty) {
      showError('请选择一个难度！');
      return;
    }

    // 密码验证已经在显示弹框之前完成，这里直接使用
    if (!serverAPI.password) {
      showError('密码已失效，请重新验证！');
      this.close();
      return;
    }

    this.confirmButton.disabled = true;
    this.confirmButton.textContent = '🔄 更改中...';

    try {
      const formData = new FormData();
      formData.append('password', serverAPI.password);
      formData.append('difficulty', this.selectedDifficulty);

      const response = await fetch('/rcon/changedifficulty', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const text = await response.text();
        showNotification('难度更改成功！');
        this.close();

        // 刷新服务器状态
        setTimeout(() => {
          if (window.refreshServerStatus) {
            window.refreshServerStatus();
          }
          if (window.serverStatusDialog && window.serverStatusDialog.loadServerStatus) {
            window.serverStatusDialog.loadServerStatus();
          }
        }, 1000);
      } else {
        const errorText = await response.text();
        showError(`更改难度失败: ${errorText}`);
      }
    } catch (error) {
      showError(`更改难度失败: ${error.message}`);
    } finally {
      this.confirmButton.disabled = false;
      this.confirmButton.textContent = '⚔️ 确认更改难度';
    }
  }
}

// 游戏模式切换对话框
class GameModeChangeDialog {
  constructor() {
    this.overlay = document.getElementById('gamemode-change-overlay');
    this.dialog = document.getElementById('gamemode-change-dialog');
    this.closeButton = document.getElementById('gamemode-change-close');
    this.confirmButton = document.getElementById('change-gamemode-confirm');
    this.selectedGameMode = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 关闭按钮
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 模式选项点击
    const gameModeOptions = document.querySelectorAll('.gamemode-option');
    gameModeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        this.selectGameMode(option);
      });
    });

    // 确认按钮
    this.confirmButton.addEventListener('click', () => {
      this.changeGameMode();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';
    this.selectedGameMode = null;
    this.confirmButton.disabled = true;

    // 清除之前的选择
    document.querySelectorAll('.gamemode-option').forEach((option) => {
      option.classList.remove('selected');
    });

    setTimeout(() => {
      this.dialog.classList.add('show');
    }, 50);
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }

  selectGameMode(option) {
    // 清除之前的选择
    document.querySelectorAll('.gamemode-option').forEach((opt) => {
      opt.classList.remove('selected');
    });

    // 选择当前选项
    option.classList.add('selected');
    this.selectedGameMode = option.dataset.gamemode;
    this.confirmButton.disabled = false;
  }

  async changeGameMode() {
    if (!this.selectedGameMode) {
      showError('请选择一个游戏模式！');
      return;
    }

    // 密码验证已经在显示弹框之前完成，这里直接使用
    if (!serverAPI.password) {
      showError('密码已失效，请重新验证！');
      this.close();
      return;
    }

    this.confirmButton.disabled = true;
    this.confirmButton.textContent = '🔄 更改中...';

    try {
      const formData = new FormData();
      formData.append('password', serverAPI.password);
      formData.append('gameMode', this.selectedGameMode);

      const response = await fetch('/rcon/changegamemode', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const text = await response.text();
        showNotification(text || '游戏模式更改成功！');
        this.close();

        // 刷新服务器状态
        setTimeout(() => {
          if (window.refreshServerStatus) {
            window.refreshServerStatus();
          }
          if (window.serverStatusDialog && window.serverStatusDialog.loadServerStatus) {
            window.serverStatusDialog.loadServerStatus();
          }
        }, 1000);
      } else {
        const errorText = await response.text();
        showError(`更改游戏模式失败: ${errorText}`);
      }
    } catch (error) {
      showError(`更改游戏模式失败: ${error.message}`);
    } finally {
      this.confirmButton.disabled = false;
      this.confirmButton.textContent = '🎮 确认更改模式';
    }
  }
}

// RCON命令对话框
class RconCommandDialog {
  constructor() {
    this.overlay = document.getElementById('rcon-command-overlay');
    this.dialog = document.getElementById('rcon-command-dialog');
    this.closeButton = document.getElementById('rcon-command-close');
    this.commandInput = document.getElementById('rcon-command-input');
    this.executeButton = document.getElementById('execute-rcon-command');
    this.resultContainer = document.getElementById('rcon-command-result');
    this.clearButton = document.getElementById('clear-rcon-result');

    this.commandHistory = [];

    this.initEventListeners();
  }

  initEventListeners() {
    // 关闭按钮
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 执行按钮
    this.executeButton.addEventListener('click', () => {
      this.executeCommand();
    });

    // 清空结果按钮
    this.clearButton.addEventListener('click', () => {
      this.clearResult();
    });

    // 回车键执行命令
    this.commandInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.executeCommand();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    });
  }

  show() {
    this.overlay.style.display = 'flex';

    setTimeout(() => {
      this.dialog.classList.add('show');
      this.commandInput.focus();
    }, 50);
  }

  close() {
    this.dialog.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);
  }

  isVisible() {
    return this.overlay.style.display === 'flex';
  }

  async executeCommand() {
    const command = this.commandInput.value.trim();

    if (!command) {
      showWarning('请输入RCON命令！');
      return;
    }

    if (!serverAPI.password) {
      showError('请先输入管理密码！');
      return;
    }

    // 禁用输入和按钮
    this.executeButton.disabled = true;
    this.commandInput.disabled = true;
    this.executeButton.textContent = '⏳ 执行中...';

    try {
      const formData = new FormData();
      formData.append('password', serverAPI.password);
      formData.append('cmd', command);

      const response = await fetch('/rcon', {
        method: 'POST',
        body: formData,
      });

      const result = await response.text();

      // 添加到历史记录
      this.addToHistory(command, result, response.ok);

      if (response.ok) {
        showNotification('命令执行成功！');
      } else {
        showError(`命令执行失败: ${result}`);
      }

      // 清空输入框
      this.commandInput.value = '';
    } catch (error) {
      this.addToHistory(command, `网络错误: ${error.message}`, false);
      showError(`命令执行失败: ${error.message}`);
    } finally {
      // 恢复输入和按钮
      this.executeButton.disabled = false;
      this.commandInput.disabled = false;
      this.executeButton.textContent = '▶️ 执行';
      this.commandInput.focus();
    }
  }

  addToHistory(command, output, isSuccess) {
    // 移除空结果提示
    const emptyMessage = this.resultContainer.querySelector('.rcon-result-empty');
    if (emptyMessage) {
      emptyMessage.remove();
    }

    // 创建结果条目
    const entry = document.createElement('div');
    entry.className = 'rcon-result-entry';

    // 时间戳
    const timestamp = document.createElement('div');
    timestamp.className = 'rcon-result-timestamp';
    timestamp.textContent = new Date().toLocaleString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    entry.appendChild(timestamp);

    // 命令
    const commandDiv = document.createElement('div');
    commandDiv.className = 'rcon-result-command';
    commandDiv.textContent = command;
    entry.appendChild(commandDiv);

    // 输出
    const outputDiv = document.createElement('div');
    outputDiv.className = isSuccess ? 'rcon-result-output' : 'rcon-result-output rcon-result-error';
    outputDiv.textContent = output || '(无输出)';
    entry.appendChild(outputDiv);

    // 添加到容器顶部
    this.resultContainer.insertBefore(entry, this.resultContainer.firstChild);

    // 保持最多50条记录
    while (this.resultContainer.children.length > 50) {
      this.resultContainer.removeChild(this.resultContainer.lastChild);
    }

    // 保存到历史记录
    this.commandHistory.unshift({ command, output, isSuccess, timestamp: new Date() });
    if (this.commandHistory.length > 50) {
      this.commandHistory.pop();
    }
  }

  clearResult() {
    this.resultContainer.innerHTML = '<div class="rcon-result-empty">等待命令执行...</div>';
    this.commandHistory = [];
  }
}

// 设置RCON命令（从提示中）
function setRconCommand(command) {
  const input = document.getElementById('rcon-command-input');
  if (input) {
    input.value = command;
    input.focus();
  }
}

// 导出为全局函数
window.setRconCommand = setRconCommand;
