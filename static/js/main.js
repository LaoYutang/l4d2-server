// 主要交互逻辑
document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const upload = document.getElementById('upload');
  const restart = document.getElementById('restart');
  const clear = document.getElementById('clear');
  const password = document.getElementById('password');
  const map = document.getElementById('map');
  const list = document.getElementById('modal-list'); // 弹框中的地图列表

  // 初始化系统
  const notificationSystem = new NotificationSystem();
  const confirmDialog = new ConfirmDialog();
  const rconMapsDialog = new RconMapsDialog();
  const serverStatusDialog = new ServerStatusDialog();
  const mapManagementDialog = new MapManagementDialog();
  const authCodeDialog = new AuthCodeDialog();
  const downloadManagementDialog = new DownloadManagementDialog();
  const difficultyChangeDialog = new DifficultyChangeDialog();

  // 设置全局实例
  window.notificationSystem = notificationSystem;
  window.confirmDialog = confirmDialog;
  window.rconMapsDialog = rconMapsDialog;
  window.serverStatusDialog = serverStatusDialog;
  window.mapManagementDialog = mapManagementDialog;
  window.authCodeDialog = authCodeDialog;
  window.downloadManagementDialog = downloadManagementDialog;
  window.difficultyChangeDialog = difficultyChangeDialog;

  // 替换原生alert和confirm
  const showNotification = notificationSystem.success.bind(notificationSystem);
  const showError = notificationSystem.error.bind(notificationSystem);
  const showWarning = notificationSystem.warning.bind(notificationSystem);
  const showInfo = notificationSystem.info.bind(notificationSystem);
  const confirmAction = confirmDialog.show.bind(confirmDialog);

  // 设置全局函数
  window.showNotification = showNotification;
  window.showError = showError;
  window.showWarning = showWarning;
  window.showInfo = showInfo;
  window.confirmAction = confirmAction;

  // 密码变化监听
  password.addEventListener('input', function () {
    serverAPI.setPassword(this.value);
  });

  // 存储所有地图数据
  let allMaps = [];

  // 更新地图列表
  function updateList() {
    // 只有在地图管理弹框打开时才更新列表
    if (!mapManagementDialog || !mapManagementDialog.isVisible()) {
      return;
    }

    fetch('/list', {
      method: 'post',
    })
      .then(async (res) => {
        const text = await res.text();
        const maps = text.split('\n').filter((map) => map.trim());

        // 解析并存储所有地图数据
        allMaps = maps.map((mapInfo) => {
          const parts = mapInfo.split('$$');
          return {
            name: parts[0],
            size: parts[1] || 'unknown',
            info: mapInfo,
          };
        });

        // 应用当前筛选
        filterAndDisplayMaps();
      })
      .catch((err) => {
        showError(err);
      });
  }

  // 筛选并显示地图
  function filterAndDisplayMaps() {
    const filterInput = document.getElementById('map-filter');
    const filterValue = filterInput ? filterInput.value.toLowerCase().trim() : '';

    // 筛选地图
    const filteredMaps = allMaps.filter((map) => map.name.toLowerCase().includes(filterValue));

    // 更新计数显示
    updateMapCount(filteredMaps.length, allMaps.length);

    // 清空列表
    list.innerHTML = '';

    // 如果没有筛选结果，显示提示信息
    if (filteredMaps.length === 0 && allMaps.length > 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'no-results-message';
      noResultsDiv.innerHTML = `
        <div class="icon">🔍</div>
        <div class="text">没有找到匹配的地图文件</div>
      `;
      list.appendChild(noResultsDiv);
      return;
    }

    // 显示筛选后的地图
    filteredMaps.forEach((mapData) => {
      const mapName = mapData.name;
      const mapSize = mapData.size;

      const container = document.createElement('div');
      container.className = 'map-item';

      // 创建地图信息显示区域
      const infoContainer = document.createElement('div');
      infoContainer.className = 'map-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'map-name';
      nameSpan.innerText = mapName;

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'map-size';
      sizeSpan.innerText = mapSize;

      // 根据文件大小添加不同的样式类
      if (mapSize !== 'unknown') {
        const sizeValue = parseFloat(mapSize);
        const sizeUnit = mapSize.slice(-2).toUpperCase();

        // 将所有大小转换为MB单位进行比较
        let sizeInMB = 0;
        if (sizeUnit === 'KB') {
          sizeInMB = sizeValue / 1024;
        } else if (sizeUnit === 'MB') {
          sizeInMB = sizeValue;
        } else if (sizeUnit === 'GB') {
          sizeInMB = sizeValue * 1024;
        }

        // 根据新的标准设置颜色
        if (sizeInMB < 500) {
          sizeSpan.classList.add('size-small'); // 绿色 - 小于500M
        } else if (sizeInMB >= 500 && sizeInMB < 1024) {
          sizeSpan.classList.add('size-medium'); // 黄色 - 500M-1G
        } else if (sizeInMB >= 1024) {
          sizeSpan.classList.add('size-large'); // 红色 - 1G以上
        }
      }

      infoContainer.appendChild(nameSpan);
      infoContainer.appendChild(sizeSpan);

      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.innerText = 'delete';
      del.onclick = async () => {
        const confirmed = await confirmAction(`确定要删除地图 "${mapName}" 吗？`, '删除地图');
        if (confirmed) {
          // 删除时只传递地图名，不包含大小信息
          fetchServer('/remove', mapName)
            .then(async (res) => {
              updateList();
              showNotification('地图删除成功！');
            })
            .catch((err) => {
              showError(err);
            });
        }
      };

      container.appendChild(infoContainer);
      container.appendChild(del);
      list.appendChild(container);
    });
  }

  // 更新地图数量显示
  function updateMapCount(filteredCount, totalCount) {
    const mapCountText = document.getElementById('map-count-text');
    if (mapCountText) {
      if (filteredCount === totalCount) {
        mapCountText.textContent = `总计: ${totalCount} 个文件`;
      } else {
        mapCountText.textContent = `显示: ${filteredCount} / ${totalCount} 个文件`;
      }
    }
  }

  // 上传处理
  async function uploadHandler() {
    if (map.files.length === 0) {
      showWarning('请先选择要上传的地图文件！');
      return;
    }

    showLoading(`上传准备中...`, 0);

    try {
      // 先验证密码
      const authRes = await fetchServer('/auth');
      if (!authRes.ok) {
        throw new Error(await authRes.text());
      }

      let successCount = 0;
      let failedFiles = [];

      // 逐个上传文件
      for (let i = 0; i < map.files.length; i++) {
        const file = map.files[i];
        const fileProgress = Math.round((i / map.files.length) * 100);

        showLoading(`准备上传 (${i + 1}/${map.files.length}) - ${file.name}`, fileProgress);

        try {
          const res = await fetchServerWithFileProgress('/upload', file, (progress) => {
            // 计算总体进度：已完成文件进度 + 当前文件进度
            const completedFilesProgress = (i / map.files.length) * 100;
            const currentFileProgress = progress / map.files.length;
            const totalCurrentProgress = Math.round(completedFilesProgress + currentFileProgress);

            showLoading(
              `上传中 (${i + 1}/${map.files.length}) - ${file.name} (${Math.round(progress)}%)`,
              totalCurrentProgress
            );
          });

          if (res.ok) {
            successCount++;
            const totalProgress = Math.round(((i + 1) / map.files.length) * 100);
            showLoading(`✅ 完成 (${i + 1}/${map.files.length}) - ${file.name}`, totalProgress);
            // 短暂显示完成状态
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            failedFiles.push(`${file.name}: ${await res.text()}`);
          }
        } catch (err) {
          failedFiles.push(`${file.name}: ${err.message}`);
        }
      }

      // 完成时显示100%进度
      showLoading('🎉 上传完成！', 100);

      // 延迟一下再显示结果
      setTimeout(() => {
        let resultMessage = `成功上传 ${successCount}/${map.files.length} 个文件`;
        if (failedFiles.length > 0) {
          resultMessage += `\n\n失败的文件:\n${failedFiles.join('\n')}`;
          showWarning(resultMessage, '上传完成');
        } else {
          showNotification(resultMessage, '上传成功');
        }
        updateList();
        hiddenLoading();
      }, 800);
    } catch (err) {
      showError(err);
      hiddenLoading();
    }
  }

  // 重启处理
  async function restartHandler() {
    const confirmed = await confirmAction('重启服务器将断开所有玩家连接，确认继续？', '重启服务器');
    if (!confirmed) return;

    showLoading('重启服务器中...', 50);
    fetchServer('/restart')
      .then(async (res) => {
        const text = await res.text();
        showLoading('重启完成！', 100);
        setTimeout(() => {
          if (res.ok) {
            showNotification(text, '服务器重启');
          } else {
            showError(text, '重启失败');
          }
          hiddenLoading();
        }, 500);
      })
      .catch((err) => {
        showError(err);
        hiddenLoading();
      });
  }

  // 清空处理
  async function clearHandler() {
    const confirmed = await confirmAction(
      '此操作将删除服务器上的所有地图文件，确认继续？',
      '清空地图目录'
    );
    if (!confirmed) return;

    showLoading('清理地图目录中...', 30);
    fetchServer('/clear')
      .then(async (res) => {
        const text = await res.text();
        showLoading('清理完成！', 100);
        setTimeout(() => {
          updateList();
          showNotification(text, '清理完成');
          hiddenLoading();
        }, 500);
      })
      .catch((err) => {
        showError(err);
        hiddenLoading();
      });
  }

  // 显示地图管理弹框
  async function showMapManagementHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    // 显示加载动画
    showLoading('验证密码中...');

    try {
      // 验证密码
      const result = await serverAPI.validatePassword();

      if (result.success) {
        // 密码正确，显示地图管理弹框
        hiddenLoading();
        mapManagementDialog.show();
      } else {
        // 密码错误
        hiddenLoading();
        showError(result.message || '密码验证失败');
      }
    } catch (error) {
      hiddenLoading();
      showError('密码验证失败: ' + error.message);
    }
  }

  // 显示RCON地图列表
  async function showRconMapsHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    // 显示加载动画
    showLoading('验证密码中...');

    try {
      // 验证密码
      const result = await serverAPI.validatePassword();

      if (result.success) {
        // 密码正确，显示RCON地图列表弹框
        hiddenLoading();
        rconMapsDialog.show();
      } else {
        // 密码错误
        hiddenLoading();
        showError(result.message || '密码验证失败');
      }
    } catch (error) {
      hiddenLoading();
      showError('密码验证失败: ' + error.message);
    }
  }

  // 切换地图处理
  async function changeMapHandler(mapName) {
    const confirmed = await confirmAction(
      `确定要切换到地图 "${mapName}" 吗？\n切换地图将重新开始游戏。`,
      '切换地图'
    );

    if (!confirmed) return;

    // 禁用所有切换按钮防止重复点击
    const switchButtons = document.querySelectorAll('.btn-switch');
    switchButtons.forEach((btn) => (btn.disabled = true));

    try {
      const response = await fetchServerWithMapName('/rcon/changemap', mapName);

      if (response.ok) {
        const message = await response.text();
        showNotification(message, '地图切换成功');
        rconMapsDialog.close();
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      showError(error.message || error);
    } finally {
      // 重新启用切换按钮
      switchButtons.forEach((btn) => (btn.disabled = false));
    }
  }

  // 踢出用户处理
  async function kickUser(userName, userId) {
    if (!serverAPI.password || serverAPI.password === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    const confirmed = await confirmAction(
      `确定要踢出玩家 "${userName}" (#${userId}) 吗？`,
      '踢出玩家'
    );

    if (!confirmed) return;

    // 禁用踢出按钮防止重复点击
    const kickButtons = document.querySelectorAll('.user-kick-btn');
    kickButtons.forEach((btn) => (btn.disabled = true));

    try {
      const fd = new FormData();
      fd.append('password', serverAPI.password);
      fd.append('userName', userName);
      fd.append('userId', userId);

      const response = await fetch('/rcon/kickuser', {
        method: 'POST',
        body: fd,
      });

      if (response.ok) {
        const message = await response.text();
        showNotification(message, '踢出成功');
        // 刷新服务器状态
        if (window.mainServerStatus) {
          window.mainServerStatus.loadServerStatus();
        }
        if (window.serverStatusDialog) {
          window.serverStatusDialog.loadServerStatus();
        }
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      showError(error.message || error);
    } finally {
      // 重新启用踢出按钮
      kickButtons.forEach((btn) => (btn.disabled = false));
    }
  }

  // 获取用户游戏时长处理
  async function getUserPlaytime(userName, steamId) {
    if (!serverAPI.password || serverAPI.password === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    if (!steamId || steamId === '') {
      showWarning('该玩家没有有效的Steam ID，无法获取游戏时长！');
      return;
    }

    // 禁用获取时长按钮防止重复点击
    const playtimeButtons = document.querySelectorAll('.user-playtime-btn');
    playtimeButtons.forEach((btn) => (btn.disabled = true));

    try {
      const fd = new FormData();
      fd.append('password', serverAPI.password);
      fd.append('steamid', steamId);

      const response = await fetch('/getUserPlaytime', {
        method: 'POST',
        body: fd,
      });

      if (response.ok) {
        const data = await response.json();
        const hours = Math.round(data.playtime * 10) / 10; // 保留一位小数
        showNotification(`玩家 "${userName}" 的Left 4 Dead 2游戏时长: ${hours} 小时`, '游戏时长');
      } else {
        // 处理错误响应，可能是JSON也可能是纯文本
        let errorMessage;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || '获取游戏时长失败';
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      showError(error.message || error);
    } finally {
      // 重新启用获取时长按钮
      playtimeButtons.forEach((btn) => (btn.disabled = false));
    }
  }

  // 文件选择变化处理
  map.addEventListener('change', function (e) {
    const fileInfo = document.getElementById('file-selected-info');
    const fileCount = document.getElementById('file-count');
    const fileList = document.getElementById('file-list');

    if (this.files.length > 0) {
      fileCount.textContent = `已选择 ${this.files.length} 个文件`;
      fileList.innerHTML = '';

      Array.from(this.files).forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file.name;
        fileList.appendChild(fileItem);
      });

      fileInfo.classList.add('show');

      // 检查是否是通过拖拽触发的change事件
      // 通过检查事件是否是人工触发的来判断
      if (e.isTrusted === false) {
        // 这是拖拽触发的事件，显示拖拽成功提示
        showInfo(`已通过拖拽选择 ${this.files.length} 个文件`);
      }
    } else {
      fileInfo.classList.remove('show');
    }
  });

  // 拖拽上传功能
  function setupDragAndDrop() {
    const fileInputButton = document.querySelector('.file-input-button');
    const fileInputWrapper = document.querySelector('.file-input-wrapper');

    if (!fileInputButton || !fileInputWrapper) return;

    // 检查是否已经绑定过事件，避免重复绑定
    if (fileInputButton.dataset.dragSetup === 'true') {
      return;
    }

    // 标记已经设置过拖拽功能
    fileInputButton.dataset.dragSetup = 'true';

    // 防止默认拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      fileInputButton.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // 拖拽进入和悬停时的视觉反馈
    ['dragenter', 'dragover'].forEach((eventName) => {
      fileInputButton.addEventListener(eventName, highlight, false);
    });

    // 拖拽离开时移除视觉反馈
    ['dragleave', 'drop'].forEach((eventName) => {
      fileInputButton.addEventListener(eventName, unhighlight, false);
    });

    // 处理文件拖放
    fileInputButton.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function highlight() {
      fileInputButton.classList.add('drag-over');
    }

    function unhighlight() {
      fileInputButton.classList.remove('drag-over');
    }

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;

      // 过滤出支持的文件类型
      const validFiles = Array.from(files).filter((file) => {
        const extension = file.name.toLowerCase().split('.').pop();
        return extension === 'vpk' || extension === 'zip';
      });

      if (validFiles.length > 0) {
        // 创建新的FileList对象（通过DataTransfer）
        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => {
          dataTransfer.items.add(file);
        });

        // 将文件赋值给input元素
        map.files = dataTransfer.files;

        // 触发change事件来更新UI
        const changeEvent = new Event('change', { bubbles: true });
        map.dispatchEvent(changeEvent);

        // 只显示一次提示，不重复显示
        // 移除了原来的showInfo和showWarning调用，避免与change事件的处理重复
      } else {
        showError('请拖拽 .vpk 或 .zip 格式的地图文件');
      }
    }
  }

  // 绑定事件处理程序
  upload.addEventListener('click', uploadHandler);
  restart.addEventListener('click', restartHandler);
  clear.addEventListener('click', clearHandler);

  // 下载任务管理按钮
  const downloadManagement = document.getElementById('download-management');
  if (downloadManagement) {
    downloadManagement.addEventListener('click', showDownloadManagementHandler);
  }

  // 地图列表刷新按钮
  const refreshMapList = document.getElementById('refresh-map-list');
  if (refreshMapList) {
    refreshMapList.addEventListener('click', () => {
      updateList();
    });
  }

  // 初始化主页面服务器状态
  const mainServerStatus = new MainServerStatus();
  window.mainServerStatus = mainServerStatus;

  // 页面加载后自动获取服务器状态
  mainServerStatus.loadServerStatus();

  // 授权码管理处理函数
  async function showAuthCodeHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    // 显示加载动画
    showLoading('验证密码中...');

    try {
      // 验证密码
      const result = await serverAPI.validatePassword();

      if (result.success) {
        // 密码正确，显示授权码管理弹框
        hiddenLoading();
        authCodeDialog.show();
      } else {
        // 密码错误
        hiddenLoading();
        showError(result.message || '密码验证失败');
      }
    } catch (error) {
      hiddenLoading();
      showError('密码验证失败: ' + error.message);
    }
  }

  // 显示下载任务管理弹框
  async function showDownloadManagementHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    // 显示加载动画
    showLoading('验证密码中...');

    try {
      // 验证密码
      const result = await serverAPI.validatePassword();

      if (result.success) {
        // 密码正确，显示下载任务管理弹框
        hiddenLoading();
        downloadManagementDialog.show();
      } else {
        // 密码错误
        hiddenLoading();
        showError(result.message || '密码验证失败');
      }
    } catch (error) {
      hiddenLoading();
      showError('密码验证失败: ' + error.message);
    }
  }

  // 设置全局函数
  window.showMapManagementHandler = showMapManagementHandler;
  window.showRconMapsHandler = showRconMapsHandler;
  window.showDownloadManagementHandler = showDownloadManagementHandler;
  window.showAuthCodeHandler = showAuthCodeHandler;
  window.changeMapHandler = changeMapHandler;
  window.kickUser = kickUser;
  window.getUserPlaytime = getUserPlaytime;
  window.updateList = updateList;
  window.refreshServerStatus = () => mainServerStatus.loadServerStatus();

  // 设置筛选功能的事件监听器
  function setupMapFilter() {
    const filterInput = document.getElementById('map-filter');
    const clearFilterBtn = document.getElementById('clear-filter');

    if (filterInput) {
      // 清除之前的事件监听器（避免重复绑定）
      filterInput.removeEventListener('input', handleFilterInput);
      filterInput.removeEventListener('keypress', handleFilterKeypress);

      // 重新绑定事件监听器
      filterInput.addEventListener('input', handleFilterInput);
      filterInput.addEventListener('keypress', handleFilterKeypress);
    }

    if (clearFilterBtn) {
      // 清除之前的事件监听器
      clearFilterBtn.removeEventListener('click', handleClearFilter);
      // 重新绑定事件监听器
      clearFilterBtn.addEventListener('click', handleClearFilter);
    }
  }

  // 筛选输入处理函数
  function handleFilterInput() {
    filterAndDisplayMaps();

    const clearFilterBtn = document.getElementById('clear-filter');
    // 控制清空按钮的显示
    if (this.value.trim()) {
      if (clearFilterBtn) clearFilterBtn.classList.add('visible');
    } else {
      if (clearFilterBtn) clearFilterBtn.classList.remove('visible');
    }
  }

  // 按键处理函数
  function handleFilterKeypress(e) {
    if (e.key === 'Enter') {
      filterAndDisplayMaps();
    }
  }

  // 清空筛选处理函数
  function handleClearFilter() {
    const filterInput = document.getElementById('map-filter');
    const clearFilterBtn = document.getElementById('clear-filter');

    if (filterInput) {
      filterInput.value = '';
      filterInput.focus();
    }
    if (clearFilterBtn) {
      clearFilterBtn.classList.remove('visible');
    }
    filterAndDisplayMaps();
  }

  // 设置全局函数供其他地方调用
  window.filterAndDisplayMaps = filterAndDisplayMaps;
  window.setupMapFilter = setupMapFilter;
  window.setupDragAndDrop = setupDragAndDrop;

  // 显示难度更改弹框（需要密码验证）
  async function showDifficultyChangeDialog() {
    if (!password.value || password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }

    // 显示加载动画
    showLoading('验证密码中...');

    try {
      // 验证密码
      const result = await serverAPI.validatePassword();

      if (result.success) {
        // 密码正确，显示难度更改弹框
        hiddenLoading();
        difficultyChangeDialog.show();
      } else {
        // 密码错误
        hiddenLoading();
        showError(result.message || '密码验证失败');
      }
    } catch (error) {
      hiddenLoading();
      showError('密码验证失败: ' + error.message);
    }
  }

  // 设置全局函数
  window.showDifficultyChangeDialog = showDifficultyChangeDialog;
});

// 全局函数 - 显示难度更改弹框
function showDifficultyChangeDialog() {
  if (window.difficultyChangeDialog) {
    window.difficultyChangeDialog.show();
  }
}
