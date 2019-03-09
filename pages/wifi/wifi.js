// pages/wifi/wifi.js
import drawQrcode from '../../weapp.qrcode.min.js'

Page({
  data: {
    startError: '',//初始化错误提示
    wifiError: '',
    scanError: '',
    platform: '', //系统 android
    ssid: '',//wifi帐号(自动获取)
    bssid: '',
    password: '',//无线网密码(必填)
  },
  onLoad: function () {
    var _this = this;
    //检测手机型号
    wx.getSystemInfo({
      success: function (res) {
        var system = '';
        if (res.platform == 'android') system = parseInt(res.system.substr(8));
        if (res.platform == 'ios') system = parseInt(res.system.substr(4));
        if (res.platform == 'android' && system < 6) {
          _this.setData({ startError: '手机版本暂时不支持' }); return
        }
        if (res.platform == 'ios' && system < 11) {
          _this.setData({ startError: '手机版本暂时不支持' }); return
        }
        _this.setData({ platform: res.system });
        //初始化 Wi-Fi 模块
        _this.startWifi(_this);
      }
    })

  },
  bindSsidInput(e) {
    this.setData({
      ssid: e.detail.value
    })
  },
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },
  generateQrcode() {
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      text: `${this.data.ssid},${this.data.password}`
    })
  },
  saveQrcode() {
    wx.canvasToTempFilePath({
      canvasId: 'myQrcode',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: (res) => {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: (err) => {
            wx.showToast({
              title: '保存失败',
              icon: 'none',
              duration: 2000
            })
          }
        })
      }
    })
  },
  scanQrcode() {
    const _this = this
    wx.scanCode({
      success(res) {
        const [SSID, password = ''] = res.result.split(',')
        let isConnected = false
        wx.showLoading({
          title: '正在连接wifi',
        })
        // 连接wifi
        wx.connectWifi({
          SSID,
          password,
          success: function () {
            wx.onWifiConnected((res) => {
              if (!isConnected && res && res.wifi && res.wifi.SSID) {
                isConnected = true
                wx.hideLoading()
                wx.showToast({
                  title: 'wifi连接成功',
                })
              }
            })
            setTimeout(() => {
              if (isConnected) { return }
              isConnected = true
              wx.showToast({
                title: 'wifi连接失败'
              })
            }, 8000)
          },
          fail: function (res) {
            wx.showToast({
              title: 'wifi连接失败'
            })
          }
        })
      }
    })
  },
  //初始化 Wi-Fi 模块。
  startWifi: function (_this) {
    wx.startWifi({
      success: function () {
        _this.getConnectedWifi(_this);
      },
      fail: function (res) {
        _this.setData({ startError: res.errMsg });
      }
    })
  },
  getConnectedWifi() {
    const _this = this
    wx.getConnectedWifi({
      success: function (res) {
        _this.setData({
          ssid: res.wifi.SSID
        })
      },
      fail: function (res) {
        _this.setData({ wifiError: res.errMsg });
      }
    })
  }
})