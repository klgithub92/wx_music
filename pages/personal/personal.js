import request from '../../utils/request'

let startY = 0; // 手指起始的坐标
let moveY = 0; // 手指移动的坐标
let moveDistance = 0; // 手指移动的距离

Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverTransform: 'translateY(0)',
    coveTransition: '',
    userInfo: {}, // 用户数据
    recentPlayList: {} // 最近播放记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取本地储存的用户数据
    let userInfo = wx.getStorageSync('userInfo')
    // console.log(userInfo)
    // 用户登录
    if (userInfo) {
      // 更新userInfo状态
      this.setData({
        userInfo: JSON.parse(userInfo)
      })

      // 获取用户播放记录
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
  },

  // 获取用户播放记录的功能函数
  async getUserRecentPlayList(userId) {
    let recentPlayListData = await request('/user/record', { uid: userId, type: 0 })
    let index = 0
    let recentPlayList = recentPlayListData.allData.splice(0, 10).map(item => {
      item.id = index++ // 添加id属性方便遍历
      return item
    })
    // console.log(recentPlayList)
    // 更新recentPlayList的状态
    this.setData({
      recentPlayList
    })
  },

  // 登录
  toLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  handleTouchStart(event) {
    // 清除开始的过渡
    this.setData({
      coveTransition: ''
    })
    // 获取手指起始坐标
    startY = event.touches[0].clientY
  },
  handleTouchMove(event) {
    moveY = event.touches[0].clientY
    moveDistance = moveY - startY

    if (moveDistance <= 0) return
    if (moveDistance >= 80) {
      moveDistance = 80
    }
    // 动态更新coverTransform的状态值
    this.setData({
      coverTransform: `translateY(${moveDistance}rpx)`
    })
  },
  handleTouchEnd() {
    // 动态更新coverTransform的状态值
    this.setData({
      coverTransform: `translateY(0)`,
      coveTransition: `all .6s linear`
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})