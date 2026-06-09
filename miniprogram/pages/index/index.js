Page({
  data: { creating: false },

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
        if (!room || !room.roomId) {
          wx.showToast({ title: 'Create failed', icon: 'none' });
          return;
        }
        wx.navigateTo({
          url: '/pages/guide/guide?roomId=' + room.roomId + '&title=' + encodeURIComponent(room.title || '') + '&expiresAt=' + encodeURIComponent(room.expiresAt || ''),
        });
      },
      fail: () => wx.showToast({ title: 'Create failed', icon: 'none' }),
      complete: () => this.setData({ creating: false }),
    });
  },

  scanToListen() {
    wx.scanCode({
      success: (res) => {
        const roomId = (res.result || '').trim();
        if (!roomId) {
          wx.showToast({ title: 'Invalid room code', icon: 'none' });
          return;
        }
        wx.navigateTo({ url: '/pages/listener/listener?roomId=' + roomId });
      },
    });
  },
});
