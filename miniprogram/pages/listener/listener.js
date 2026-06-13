const fs = wx.getFileSystemManager();
const MAX_AUDIO_QUEUE_LENGTH = 30;
const MAX_AUDIO_CHUNK_BYTES = 256 * 1024;

Page({
  data: {
    listenerToken: '',
    title: '',
    guideName: '',
    status: 'idle', // idle | connecting | connected | guide_away | ended
    graceCountdown: '',
  },

  ws: null,
  audioCtx: null,
  audioQueue: [],
  isPlaying: false,
  chunkIndex: 0,
  graceTimer: null,

  onLoad(options) {
    const listenerToken = options.listenerToken || options.roomId || '';
    this.setData({ listenerToken });
    const app = getApp();
    wx.request({
      url: app.globalData.relayBase + '/relay-api/rooms/' + encodeURIComponent(listenerToken),
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ title: res.data.title || '', guideName: res.data.guideName || '' });
        } else {
          this.setData({ status: 'ended' });
        }
      },
      fail: () => this.setData({ status: 'ended' }),
    });
  },

  startListening() {
    this.setData({ status: 'connecting' });

    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.obeyMuteSwitch = false;
    this.audioCtx.onEnded(() => this._playNext());
    this.audioCtx.onError(() => this._playNext());

    const app = getApp();
    const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = wx.connectSocket({
      url: base + '/relay-ws?listenerToken=' + encodeURIComponent(this.data.listenerToken) + '&role=listener',
      fail: () => this.setData({ status: 'ended' }),
    });

    this.ws.onOpen(() => this.setData({ status: 'connected' }));

    this.ws.onMessage((res) => {
      if (typeof res.data === 'string') {
        try {
          const msg = JSON.parse(res.data);
          if (msg.type === 'guide_disconnected') {
            this._startGraceCountdown(msg.expiresAt);
          } else if (msg.type === 'guide_reconnected') {
            this._stopGraceCountdown();
            this.setData({ status: 'connected' });
          } else if (msg.type === 'room_ended') {
            this._stopGraceCountdown();
            this._cleanup();
            this.setData({ status: 'ended' });
          }
        } catch (_) {}
        return;
      }

      if (!res.data || res.data.byteLength > MAX_AUDIO_CHUNK_BYTES) {
        return;
      }

      while (this.audioQueue.length >= MAX_AUDIO_QUEUE_LENGTH) {
        const droppedPath = this.audioQueue.shift();
        this._deleteFile(droppedPath);
      }

      // Binary: AAC audio chunk — write to temp file and queue for playback
      this.chunkIndex += 1;
      const path = wx.env.USER_DATA_PATH + '/gr_' + this.chunkIndex + '.aac';
      fs.writeFile({
        filePath: path,
        data: res.data,
        encoding: 'binary',
        success: () => {
          this.audioQueue.push(path);
          if (!this.isPlaying) this._playNext();
        },
      });
    });

    this.ws.onClose(() => {
      if (this.data.status !== 'ended') this.setData({ status: 'ended' });
    });
  },

  _deleteFile(path) {
    if (path) fs.unlink({ filePath: path, fail: () => {} });
  },

  _playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const path = this.audioQueue.shift();
    this.audioCtx.src = path;
    this.audioCtx.play();
    // Delete the file after a delay to avoid filling storage
    setTimeout(() => this._deleteFile(path), 8000);
  },

  _startGraceCountdown(expiresAt) {
    this._stopGraceCountdown();
    const expiry = new Date(expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, expiry - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const t = mins + ':' + String(secs).padStart(2, '0');
      this.setData({ status: 'guide_away', graceCountdown: t });
      if (remaining <= 0) this._stopGraceCountdown();
    };
    tick();
    this.graceTimer = setInterval(tick, 1000);
  },

  _stopGraceCountdown() {
    if (this.graceTimer) { clearInterval(this.graceTimer); this.graceTimer = null; }
  },

  _cleanup() {
    this._stopGraceCountdown();
    if (this.ws) { this.ws.close({}); this.ws = null; }
    if (this.audioCtx) { this.audioCtx.stop(); this.audioCtx.destroy(); this.audioCtx = null; }
    this.audioQueue.forEach((path) => this._deleteFile(path));
    this.audioQueue = [];
    this.isPlaying = false;
  },

  goHome() {
    wx.navigateBack({ delta: 99 });
  },

  onUnload() {
    this._cleanup();
  },
});
