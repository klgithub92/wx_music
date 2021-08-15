// 引入通信的第三方包
// 这里是订阅方 注意先订阅后发布
import PubSub from 'pubsub-js'

import request from '../../../utils/request'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    day: '', // 天
    month: '', // 月
    recommendList: [], // 推荐列表数据
    index: 0 // 点击音乐的下标 用于锁定上一首下一首的标识
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          // 跳转至登录界面
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
    }
    // 更新时间 小程序自带
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1
    })

    // 获取每日推荐的数据
    this.getRecommendList()

    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType', (eventName, type) => {
      // console.log(eventName, type)
      let { recommendList, index } = this.data
      // console.log(recommendList, index)
      if (type === 'pre') { // 上一首
        (index === 0) && (index = recommendList.length)
        index -= 1
      } else {
        (index === recommendList.length - 1) && (index = -1)
        index += 1
      }

      // 更新下标
      this.setData({
        index
      })

      // 根据下标获取点击的音乐id
      let musicId = recommendList[index].id
      // console.log(musicId)
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId', musicId)
    })
  },

  // 获取每日推荐数据的回调
  async getRecommendList() {
    let recommendListData = await request('/recommend/songs')
    // 更新data中recommendList
    this.setData({
      recommendList: recommendListData.recommend
    })
  },

  // 跳转歌曲详情页并携带数据
  toSongDetail(event) {
    // console.log(event.currentTarget.dataset.song)
    let { song, index } = event.currentTarget.dataset
    // 把index数据保存
    this.setData({
      index
    })
    // 使用query参数
    wx.navigateTo({
      // 这里传递的参数长度过长
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.id
    })

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () { },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () { },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () { },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () { },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () { },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () { }
})
