const recorder = wx.getRecorderManager();

Page({
  data: {
    roomId: '',
    listenerToken: '',
    guideToken: '',
    qrcodeUrl: '',
    listenerCount: 0,
    micOn: false,
  },

  ws: null,
  recording: false,

  onLoad(options) {
    const roomId = options.roomId || '';
    const listenerToken = options.listenerToken || '';
    const guideToken = options.guideToken || '';
    const app = getApp();
    const qrcodeUrl = app.globalData.relayBase + '/relay-api/rooms/' + encodeURIComponent(listenerToken) + '/qrcode';
    this.setData({ roomId, listenerToken, guideToken, qrcodeUrl });
    this._connectWs(roomId, guideToken);
    this._setupRecorder();
  },

  _connectWs(roomId, guideToken) {
    if (!roomId || !guideToken) {
      wx.showToast({ title: '导游权限无效', icon: 'none' });
      return;
    }

    const app = getApp();
    const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = wx.connectSocket({
      url: base
        + '/relay-ws?roomId=' + encodeURIComponent(roomId)
        + '&role=guide&guideToken=' + encodeURIComponent(guideToken),
      fail: () => wx.showToast({ title: '连接失败', icon: 'none' }),
    });
    this.ws.onMessage((res) => {
      if (typeof res.data === 'string') {
        const msg = JSON.parse(res.data);
        if (msg.type === 'listener_count') {
          this.setData({ listenerCount: msg.count });
        }
      }
    });
    this.ws.onError(() => wx.showToast({ title: '连接断开', icon: 'none' }));
  },

  _setupRecorder() {
    recorder.onFrameRecorded(({ frameBuffer }) => {
      if (this.ws && frameBuffer) {
        this.ws.send({ data: frameBuffer });
      }
    });
    recorder.onStop(() => { this.recording = false; });
    recorder.onError(() => {
      this.recording = false;
      this.setData({ micOn: false });
      wx.showToast({ title: '录音出错', icon: 'none' });
    });
  },

  copyRoomId() {
    wx.setClipboardData({
      data: this.data.listenerToken,
      success: () => wx.showToast({ title: '已复制房间码', icon: 'success' }),
    });
  },

  toggleMic() {
    if (this.data.micOn) {
      recorder.stop();
      this.setData({ micOn: false });
    } else {
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          recorder.start({
            duration: 600000,
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 48000,
            format: 'aac',
            frameSize: 1,
          });
          this.recording = true;
          this.setData({ micOn: true });
        },
        fail: () => wx.showToast({ title: '需要麦克风权限', icon: 'none' }),
      });
    }
  },

  endRoom() {
    wx.showModal({
      title: '确认结束',
      content: '结束房间后所有访客将断开连接。',
      success: (res) => {
        if (res.confirm) {
          if (this.recording) recorder.stop();
          if (this.ws) this.ws.close({});
          wx.navigateBack();
        }
      },
    });
  },

  onUnload() {
    if (this.recording) recorder.stop();
    if (this.ws) this.ws.close({});
  },
});
