// 引入通信的第三方包
// 这里是发布方
import PubSub from 'pubsub-js'

// 时间格式插件
import moment from 'moment'

import request from '../../../utils/request'
// 获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,// 是否在播放歌曲
    song: {}, // 歌曲详情对象
    musicId: '', // 歌曲id
    musicLink: '', // 歌曲连接
    currentTime: '00:00',  // 实时时间
    durationTime: '00:00', // 总时长
    currentWidth: 0, // 播放进度
  },



  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options:用于接受路由跳转的query参数
    // JSON.setData(options)报错 不是完整的json对象
    // 原生小程序路由参数，对参数长度又限制，如果长度过长会自动截取
    // console.log(JSON.setData(options))

    let musicId = options.musicId
    this.setData({
      musicId
    })
    // 获取歌曲详情
    this.getSongDetail(musicId)

    // 判断当前页面音乐是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
      // 修改当前页面音乐播放状态为true
      this.setData({
        isPlay: true
      })
    }

    /*
   * 问题： 如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面显示是否播放的状态和真实的音乐播放状态不一致
   * 解决方案：
   *   1. 通过控制音频的实例 backAudioManager 去监视音乐播放/暂停
   *
   * */
    // 创建控制音乐播放的实例
    this.backAudioManager = wx.getBackgroundAudioManager()
    this.backAudioManager.onPlay(() => {
      this.changePlayState(true)

      // 修改全根据音乐播放的状态id
      appInstance.globalData.musicId = musicId
    })
    this.backAudioManager.onPause(() => {
      this.changePlayState(false)
    })
    this.backAudioManager.onStop(() => {
      this.changePlayState(false)
    })

    // 监听音乐播放自然结束
    this.backAudioManager.onEnded(() => {
      // 自动切换下一首 并且自动播放
      PubSub.publish('switchType', 'next')

      // 订阅来自recommendSong页面发布的musicId消息
      PubSub.subscribe('musicId', (msg, musicId) => {
        // console.log(musicId)
        // 取消订阅 避免多次重复
        PubSub.unsubscribe('musicId')
        // 根据musicId获取歌曲详情
        this.getSongDetail(musicId)
        // 关闭当前音乐
        this.backAudioManager.stop()
        // 自动播放
        this.musicControl(true, musicId)
      })

      // 将实时进度条长度还原0, 时间还原0
      this.setData({
        currentWidth: 0,
        currentTime: '00:00'
      })
    })

    // 监听音乐实时播放的进度
    this.backAudioManager.onTimeUpdate(() => {
      // 这里的单位是s
      // console.log('总时长', this.backAudioManager.duration)
      // console.log('实时的时长', this.backAudioManager.currentTime)
      // 格式化实时的播放时间
      let currentTime = moment(this.backAudioManager.currentTime * 1000).format('mm:ss')
      // 进度条
      let currentWidth = this.backAudioManager.currentTime / this.backAudioManager.duration * 450
      this.setData({
        currentTime,
        currentWidth
      })
    })
  },

  // 修改播放状态的功能函数
  changePlayState(isPlay) {
    this.setData({
      isPlay
    })

    // 修改全局的实例属性值
    appInstance.globalData.isMusicPlay = isPlay
  },
  // 播放和暂停的回调
  handleMusicPlay() {
    let isPlay = !this.data.isPlay
    // this.setData({
    //   isPlay
    // })

    // 调用播放和暂停函数
    let { musicId, musicLink } = this.data
    this.musicControl(isPlay, musicId, musicLink)
  },
  // 根据musicId获取歌曲详情
  async getSongDetail(musicId) {
    let song = await request('/song/detail?ids=' + musicId)
    // 获取总时长
    // song.songs[0].dt 单位ms
    let durationTime = moment(song.songs[0].dt).format('mm:ss')
    this.setData({
      song: song.songs[0],
      durationTime
    })

    // 动态的修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.name
    })
  },

  // 控制播放和暂停的功能函数
  async musicControl(isPlay, musicId, musicLink) {
    // 创建控制音乐播放的实例
    this.backAudioManager = wx.getBackgroundAudioManager()
    if (isPlay) { // 音乐播放
      // 通过是否含有实参musicLink来决定是否发请求 性能优化了
      if (!musicLink) {
        // 获取音乐播放连接
        let musicLinkData = await request('/song/url', { id: musicId })
        musicLink = musicLinkData.data[0].url

        this.setData({
          musicLink
        })
      }

      // 设置必填属性
      this.backAudioManager.src = musicLink
      this.backAudioManager.title = this.data.song.name
    } else {
      // 暂停播放
      this.backAudioManager.pause()
    }
  },

  // 点击播放上一首和下一首
  handleSwitch(event) {
    // 点击类型
    let playType = event.currentTarget.id
    // console.log(playType)

    // 关闭当前播放的音乐
    this.backAudioManager.stop()

    // 订阅来自recommendSong页面发布的musicId消息
    PubSub.subscribe('musicId', (msg, musicId) => {
      // console.log(musicId)
      // 根据musicId获取歌曲详情
      this.getSongDetail(musicId)

      // 点击上下一首自动播放
      this.musicControl(true, musicId)
      // 取消订阅
      PubSub.unsubscribe('musicId')
    })

    // 发布消息数据给recommendSong页面
    PubSub.publish('switchType', playType)
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