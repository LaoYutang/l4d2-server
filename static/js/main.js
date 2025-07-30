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

  // 设置全局实例
  window.notificationSystem = notificationSystem;
  window.confirmDialog = confirmDialog;
  window.rconMapsDialog = rconMapsDialog;
  window.serverStatusDialog = serverStatusDialog;
  window.mapManagementDialog = mapManagementDialog;

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
        list.innerHTML = '';
        maps.forEach((map) => {
          const container = document.createElement('div');
          container.className = 'map-item';
          const span = document.createElement('span');
          span.className = 'map-name';
          span.innerText = map;
          const del = document.createElement('button');
          del.className = 'btn-delete';
          del.innerText = 'delete';
          del.onclick = async () => {
            const confirmed = await confirmAction(`确定要删除地图 "${map}" 吗？`, '删除地图');
            if (confirmed) {
              fetchServer('/remove', map)
                .then(async (res) => {
                  updateList();
                  showNotification('地图删除成功！');
                })
                .catch((err) => {
                  showError(err);
                });
            }
          };
          container.appendChild(span);
          container.appendChild(del);
          list.appendChild(container);
        });
      })
      .catch((err) => {
        showError(err);
      });
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

  // 显示服务器状态
  async function showServerStatusHandler() {
    if (password.value === '') {
      showWarning('请先输入管理密码！');
      return;
    }
    serverStatusDialog.show();
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
  map.addEventListener('change', function () {
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
    } else {
      fileInfo.classList.remove('show');
    }
  });

  // 绑定事件处理程序
  upload.addEventListener('click', uploadHandler);
  restart.addEventListener('click', restartHandler);
  clear.addEventListener('click', clearHandler);

  // 设置全局函数
  window.showMapManagementHandler = showMapManagementHandler;
  window.showRconMapsHandler = showRconMapsHandler;
  window.showServerStatusHandler = showServerStatusHandler;
  window.changeMapHandler = changeMapHandler;
  window.updateList = updateList;
});
