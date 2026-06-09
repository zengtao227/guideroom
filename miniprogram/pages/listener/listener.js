const fs = wx.getFileSystemManager();

Page({
  data: {
    roomId: '',
    title: '',
    guideName: '',
    status: 'idle', // idle | connecting | connected | ended
  },

  ws: null,
  audioCtx: null,
  audioQueue: [],
  isPlaying: false,
  chunkIndex: 0,

  onLoad(options) {
    const roomId = options.roomId || '';
    this.setData({ roomId });
    const app = getApp();
    wx.request({
      url: app.globalData.relayBase + '/relay-api/rooms/' + roomId,
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
      url: base + '/relay-ws?roomId=' + this.data.roomId + '&role=listener',
      fail: () => this.setData({ status: 'ended' }),
    });

    this.ws.onOpen(() => this.setData({ status: 'connected' }));

    this.ws.onMessage((res) => {
      if (typeof res.data === 'string') {
        const msg = JSON.parse(res.data);
        if (msg.type === 'room_ended') {
          this._cleanup();
          this.setData({ status: 'ended' });
        }
        return;
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
    setTimeout(() => fs.unlink({ filePath: path, fail: () => {} }), 8000);
  },

  _cleanup() {
    if (this.ws) { this.ws.close({}); this.ws = null; }
    if (this.audioCtx) { this.audioCtx.stop(); this.audioCtx.destroy(); this.audioCtx = null; }
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
