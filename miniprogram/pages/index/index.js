Page({
  data: { creating: false, roomIdInput: '' },

  createRoom() {
    if (this.data.creating) return;
    this.setData({ creating: true });
    const app = getApp();
    wx.request({
      url: app.globalData.relayBase + '/relay-api/rooms',
      method: 'POST',
      data: { title: '', guideName: '', durationHours: 1 },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const room = res.data;
        if (!room || !room.roomId || !room.listenerToken || !room.guideToken) {
          wx.showToast({ title: 'Create failed', icon: 'none' });
          return;
        }
        wx.navigateTo({
          url: '/pages/guide/guide?roomId=' + room.roomId
            + '&listenerToken=' + encodeURIComponent(room.listenerToken)
            + '&guideToken=' + encodeURIComponent(room.guideToken)
            + '&title=' + encodeURIComponent(room.title || '')
            + '&expiresAt=' + encodeURIComponent(room.expiresAt || ''),
        });
      },
      fail: () => wx.showToast({ title: 'Create failed', icon: 'none' }),
      complete: () => this.setData({ creating: false }),
    });
  },

  onRoomIdInput(e) {
    this.setData({ roomIdInput: e.detail.value });
  },

  enterRoomId() {
    const listenerToken = this.data.roomIdInput.trim();
    if (!listenerToken) {
      wx.showToast({ title: '请输入房间码', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/listener/listener?listenerToken=' + encodeURIComponent(listenerToken) });
  },

  scanToListen() {
    wx.scanCode({
      success: (res) => {
        const listenerToken = (res.result || '').trim();
        if (!listenerToken) {
          wx.showToast({ title: 'Invalid room code', icon: 'none' });
          return;
        }
        wx.navigateTo({ url: '/pages/listener/listener?listenerToken=' + encodeURIComponent(listenerToken) });
      },
    });
  },
});
