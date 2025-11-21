// 服务器API相关功能
class ServerAPI {
  constructor() {
    this.password = null;
  }

  setPassword(password) {
    this.password = password;
  }

  // 验证密码是否正确
  async validatePassword() {
    if (!this.password || this.password === '') {
      return { success: false, message: t('password_empty') };
    }

    try {
      const fd = new FormData();
      fd.append('password', this.password);

      const response = await fetch('/auth', {
        method: 'POST',
        body: fd,
      });

      const text = await response.text();

      if (response.ok) {
        return { success: true, message: t('password_verified') };
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: t('network_error', error.message) };
    }
  }

  // 基础请求方法
  fetchServer(path, mapName) {
    if (!this.password || this.password === '') {
      return Promise.reject(t('password_empty'));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    if (mapName) {
      fd.append('map', mapName);
    }

    return fetch(path, {
      method: 'POST',
      body: fd,
    });
  }

  // 带文件上传的请求
  fetchServerWithFile(path, file) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error(t('password_empty')));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    fd.append('map', file);

    return fetch(path, {
      method: 'POST',
      body: fd,
    });
  }

  // 带进度回调的文件上传
  fetchServerWithFileProgress(path, file, progressCallback) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error(t('password_empty')));
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('password', this.password);
      fd.append('map', file);

      // 上传进度监听
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          if (progressCallback) {
            progressCallback(progress);
          }
        }
      });

      // 完成监听
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            ok: true,
            status: xhr.status,
            text: () => Promise.resolve(xhr.responseText),
          });
        } else {
          resolve({
            ok: false,
            status: xhr.status,
            text: () => Promise.resolve(xhr.responseText),
          });
        }
      });

      // 错误监听
      xhr.addEventListener('error', () => {
        reject(new Error(t('network_error_msg', 'Network error')));
      });

      xhr.open('POST', path);
      xhr.send(fd);
    });
  }

  // 带地图名的请求
  fetchServerWithMapName(path, mapName) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error(t('password_empty')));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    fd.append('mapName', mapName);

    return fetch(path, {
      method: 'POST',
      body: fd,
    });
  }

  // 下载任务相关API
  async addDownloadTask(url) {
    try {
      const response = await this.fetchServerWithUrl('/download/add', url);
      const text = await response.text();

      if (response.ok) {
        return { success: true, message: text };
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getDownloadTasks() {
    try {
      const response = await this.fetchServer('/download/list');
      const text = await response.text();

      if (response.ok) {
        try {
          const data = JSON.parse(text);
          return { success: true, data: data };
        } catch (e) {
          // 如果不是JSON格式，返回空数组
          return { success: true, data: [] };
        }
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async clearDownloadTasks() {
    try {
      const response = await this.fetchServer('/download/clear');
      const text = await response.text();

      if (response.ok) {
        return { success: true, message: text };
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async cancelDownloadTask(index) {
    try {
      const response = await this.fetchServerWithIndex('/download/cancel', index);
      const text = await response.text();

      if (response.ok) {
        return { success: true, message: text };
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async restartDownloadTask(index) {
    try {
      const response = await this.fetchServerWithIndex('/download/restart', index);
      const text = await response.text();

      if (response.ok) {
        return { success: true, message: text };
      } else {
        return { success: false, message: text };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 带URL的请求
  fetchServerWithUrl(path, url) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error(t('password_empty')));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    fd.append('url', url);

    return fetch(path, {
      method: 'POST',
      body: fd,
    });
  }

  // 带索引的请求
  fetchServerWithIndex(path, index) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error(t('password_empty')));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    fd.append('index', index.toString());

    return fetch(path, {
      method: 'POST',
      body: fd,
    });
  }
}

// 加载动画管理
class LoadingManager {
  constructor() {
    this.loadingElement = document.getElementById('loading');
    this.loadingText = document.getElementById('loading-text');
    this.loadingProgressBar = document.getElementById('loading-progress-bar');
    this.loadingProgressText = document.getElementById('loading-progress-text');
  }

  show(text, progress = 0) {
    this.loadingText.innerText = text;
    this.loadingProgressBar.style.width = progress + '%';
    this.loadingProgressText.innerText = Math.round(progress) + '%';
    this.loadingElement.style.display = 'flex';
  }

  hide() {
    this.loadingElement.style.display = 'none';
    this.loadingProgressBar.style.width = '0%';
    this.loadingProgressText.innerText = '0%';
  }

  updateProgress(progress, text) {
    if (text) {
      this.loadingText.innerText = text;
    }
    this.loadingProgressBar.style.width = progress + '%';
    this.loadingProgressText.innerText = Math.round(progress) + '%';
  }
}

// 创建全局实例
const serverAPI = new ServerAPI();
const loadingManager = new LoadingManager();

// 全局函数封装，保持向后兼容
function fetchServer(path, mapName) {
  return serverAPI.fetchServer(path, mapName);
}

function fetchServerWithFile(path, file) {
  return serverAPI.fetchServerWithFile(path, file);
}

function fetchServerWithFileProgress(path, file, progressCallback) {
  return serverAPI.fetchServerWithFileProgress(path, file, progressCallback);
}

function fetchServerWithMapName(path, mapName) {
  return serverAPI.fetchServerWithMapName(path, mapName);
}

function showLoading(text, progress = 0) {
  loadingManager.show(text, progress);
}

function hiddenLoading() {
  loadingManager.hide();
}
