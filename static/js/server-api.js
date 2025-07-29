// 服务器API相关功能
class ServerAPI {
  constructor() {
    this.password = null;
  }

  setPassword(password) {
    this.password = password;
  }

  // 基础请求方法
  fetchServer(path, mapName) {
    if (!this.password || this.password === '') {
      return Promise.reject('密码不能为空！');
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
      return Promise.reject(new Error('密码不能为空！'));
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
      return Promise.reject(new Error('密码不能为空！'));
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
        reject(new Error('网络错误'));
      });

      xhr.open('POST', path);
      xhr.send(fd);
    });
  }

  // 带地图名的请求
  fetchServerWithMapName(path, mapName) {
    if (!this.password || this.password === '') {
      return Promise.reject(new Error('密码不能为空！'));
    }
    const fd = new FormData();
    fd.append('password', this.password);
    fd.append('mapName', mapName);

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
