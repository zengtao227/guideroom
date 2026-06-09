Page({
  data: {
    roomId: '',
    title: '',
    guideName: '',
    status: 'idle'
  },

  onLoad(options) {
    const roomId = options.roomId || '';
    this.setData({ roomId });
  },

  startListening() {
    this.setData({ status: 'connecting' });
    const app = getApp();
    const base = app.globalData.relayBase.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = wx.connectSocket({
      url: base + '/relay-ws?roomId=' + this.data.roomId + '&role=listener'
    });
    this.ws.onOpen(() => this.setData({ status: 'connected' }));
    this.ws.onClose(() => this.setData({ status: 'ended' }));
  },

  goHome() {
    wx.navigateBack({ delta: 99 });
  },

  onUnload() {
    if (this.ws) this.ws.close({});
  }
});
