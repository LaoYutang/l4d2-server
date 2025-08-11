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

  // 设置全局实例
  window.notificationSystem = notificationSystem;
  window.confirmDialog = confirmDialog;
  window.rconMapsDialog = rconMapsDialog;
  window.serverStatusDialog = serverStatusDialog;
  window.mapManagementDialog = mapManagementDialog;
  window.authCodeDialog = authCodeDialog;

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

        if (sizeUnit === 'KB' || (sizeUnit === 'MB' && sizeValue < 50)) {
          sizeSpan.classList.add('size-small');
        } else if (sizeUnit === 'MB' && sizeValue >= 50) {
          sizeSpan.classList.add('size-medium');
        } else if (sizeUnit === 'GB') {
          sizeSpan.classList.add('size-large');
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
        mapCountText.textContent = `总计: ${totalCount} 个地图`;
      } else {
        mapCountText.textContent = `显示: ${filteredCount} / ${totalCount} 个地图`;
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
          showNotification(text, '服务器重启');
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
    mapManagementDialog.show();
  }

  // 显示RCON地图列表
  async function showRconMapsHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }
    rconMapsDialog.show();
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

  // 初始化主页面服务器状态
  const mainServerStatus = new MainServerStatus();
  window.mainServerStatus = mainServerStatus;

  // 页面加载后自动获取服务器状态
  mainServerStatus.loadServerStatus();

  // 授权码管理处理函数
  function showAuthCodeHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }
    authCodeDialog.show();
  }

  // 设置全局函数
  window.showMapManagementHandler = showMapManagementHandler;
  window.showRconMapsHandler = showRconMapsHandler;
  window.showAuthCodeHandler = showAuthCodeHandler;
  window.changeMapHandler = changeMapHandler;
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
});
