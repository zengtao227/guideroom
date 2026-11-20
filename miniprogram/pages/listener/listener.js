const fs = wx.getFileSystemManager();
const MAX_AUDIO_QUEUE_LENGTH = 30;
const MAX_AUDIO_CHUNK_BYTES = 256 * 1024;
let chunkIndex = 0;

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
  playingPath: null,
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
    if (this.data.status !== 'idle') return;
    this.setData({ status: 'connecting' });
    this.audioQueue = [];

    const audioCtx = wx.createInnerAudioContext();
    this.audioCtx = audioCtx;
    audioCtx.obeyMuteSwitch = false;
    const playNext = () => {
      if (this.audioCtx === audioCtx) this._playNext();
    };
    audioCtx.onEnded(playNext);
    audioCtx.onError(playNext);

    const finish = (socketClosed = false) => {
      if (this.audioCtx !== audioCtx) return;
      if (socketClosed) this.ws = null;
      this._cleanup();
      this.setData({ status: 'ended' });
    };

    const app = getApp();
    const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = wx.connectSocket({
      url: base + '/relay-ws?listenerToken=' + encodeURIComponent(this.data.listenerToken) + '&role=listener',
      fail: () => finish(true),
    });
    this.ws = ws;

    ws.onOpen(() => {
      if (this.ws === ws) this.setData({ status: 'connected' });
    });

    ws.onMessage((res) => {
      if (this.ws !== ws) return;
      if (typeof res.data === 'string') {
        try {
          const msg = JSON.parse(res.data);
          if (msg.type === 'guide_disconnected') {
            this._startGraceCountdown(msg.expiresAt);
          } else if (msg.type === 'guide_reconnected') {
            this._stopGraceCountdown();
            this.setData({ status: 'connected' });
          } else if (msg.type === 'room_ended') {
            finish();
          }
        } catch (_) {}
        return;
      }

      if (!res.data || res.data.byteLength > MAX_AUDIO_CHUNK_BYTES) {
        return;
      }

      // Binary: AAC audio chunk — write to temp file and queue for playback
      const path = wx.env.USER_DATA_PATH + '/gr_' + Date.now() + '_' + ++chunkIndex + '.aac';
      fs.writeFile({
        filePath: path,
        data: res.data,
        encoding: 'binary',
        success: () => {
          if (this.ws !== ws) {
            this._deleteFile(path);
            return;
          }
          if (this.audioQueue.length >= MAX_AUDIO_QUEUE_LENGTH) {
            this._deleteFile(this.audioQueue.shift());
          }
          this.audioQueue.push(path);
          if (!this.playingPath) this._playNext();
        },
      });
    });

    ws.onError(() => finish());
    ws.onClose(() => finish(true));
  },

  _deleteFile(path) {
    if (path) fs.unlink({ filePath: path, fail: () => {} });
  },

  _playNext() {
    this._deleteFile(this.playingPath);
    this.playingPath = this.audioQueue.shift() || null;
    if (!this.playingPath) return;
    this.audioCtx.src = this.playingPath;
    this.audioCtx.play();
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
    this.graceTimer = setInterval(tick, 1000);
    tick();
  },

  _stopGraceCountdown() {
    if (this.graceTimer) { clearInterval(this.graceTimer); this.graceTimer = null; }
  },

  _cleanup() {
    this._stopGraceCountdown();
    const ws = this.ws;
    this.ws = null;
    ws?.close({});
    const audioCtx = this.audioCtx;
    this.audioCtx = null;
    audioCtx?.destroy();
    this._deleteFile(this.playingPath);
    this.playingPath = null;
    this.audioQueue.forEach((path) => this._deleteFile(path));
    this.audioQueue = [];
  },

  goHome() {
    wx.navigateBack({ delta: 99 });
  },

  onUnload() {
    this._cleanup();
  },
});
