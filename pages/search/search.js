import request from '../../utils/request'
let isSend = false; // 函数节流使用
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '', // placeholder的动态内容
    hotList: [], // 热搜榜数组
    searchContent: '', // 用戶輸入内容
    searchList: [], // 关键字模糊匹配的数据
    historyList: [] // 搜索历史记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取初始化数据
    this.getInitData()

    // 获取历史记录
    this.getSearchHistory()
  },

  // 获取本地历史记录的功能函数
  getSearchHistory() {
    let historyListData = wx.getStorageSync('searchHistory')
    if (historyListData) {
      this.setData({
        historyList: historyListData
      })
    }
  },

  // 获得初始化数据
  async getInitData() {
    let placeholderData = await request('/search/default')
    let hotListData = await request('/search/hot/detail')
    this.setData({
      placeholderContent: placeholderData.data.showKeyword,
      hotList: hotListData.data
    })
  },

  // 表單内容發送改變的回調
  handleInputChange(event) {
    // console.log(event)
    // 跟新searchContent
    this.setData({
      searchContent: event.detail.value.trim()
    })
    if (isSend) {
      return
    }
    isSend = true
    // 获取搜索数据
    this.getSearchList()
    // 函数节流
    setTimeout(() => {
      isSend = false
    }, 300)
  },

  // 获取搜索数据的功能函数
  async getSearchList() {
    // 判断是否输入
    if (!this.data.searchContent) {
      this.setData({
        searchList: []
      })
      return
    }
    let { searchContent, historyList } = this.data;
    // 发请求获取关键字模糊匹配数据
    let searchListData = await request('/search', { keywords: searchContent, limit: 10 })
    this.setData({
      searchList: searchListData.result.songs
    })

    // 将搜索的关键字添加到搜索历史记录中
    if (historyList.indexOf(searchContent) !== -1) {
      historyList.splice(historyList.indexOf(searchContent), 1)
    }
    historyList.unshift(searchContent)
    this.setData({
      historyList
    })
    // 保存到本地
    wx.setStorageSync('searchHistory', historyList)
  },

  // 清除输入的内容
  clearSearchContent() {
    this.setData({
      searchContent: '',
      searchList: []
    })
  },

  // 删除搜索的历史记录
  deleteSearchHistory() {
    wx.showModal({
      title: '历史记录',
      content: '是否清空历史记录?',
      success: (result) => {
        if (result.confirm) {
          // 置空data里的数据
          this.setData({
            historyList: []
          })

          // 置空本地存储的数据
          wx.removeStorageSync('searchHistory')
        }
      }
    })
  },

  // 点击跳转至video页面
  toVideo() {
    wx.switchTab({
      url: '/pages/video/video',
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