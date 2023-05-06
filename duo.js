// 定义题目数据，包括题目标题、答案、选项等信息
let titles = []
const app=getApp()
let errorOptions=[]
Page({
    data: {
      titles: [], // 所有题目
      subject: null, // 当前题目
      current: 1, // 当前题目序号
      selected: [], // 用户选择的答案，修改为数组
      progressPercent: 0, // 进度百分比
      score: 0, // 初始化得分为0
      errorOptions: [], // 用户错题集合
      submitted: false, // 初始时未提交过最后一题
      total: 0, // 题目总数
      prevBtnDisabled: true, // 上一题按钮禁用状态
      nextBtnDisabled: false, // 下一题按钮启用状态
    },
    
    onLoad() {
      wx.showLoading({
        title: '加载中...',
      });
      wx.cloud.database().collection('duo').get().then(res => {
        console.log('题库数据', res);
        const titles = res.data || []; // 如果 res.data 为空则将 titles 设置为空数组
        console.log('titles', titles);
        const subject = titles[0];
        console.log('subject', subject);
        this.setData({
          titles,
          subject,
          total: titles.length,
          current: 1, // 初始化当前题目序号
          prevBtnDisabled: true, // 上一题按钮禁用状态
          nextBtnDisabled: false, // 下一题按钮启用状态
        });
        wx.hideLoading(); // 加载完成后隐藏loading
      });
    },
    
    // 上一题按钮点击事件
    prevQuestion() {
      const current = this.data.current - 1; // 获取当前题目序号
      const prevBtnDisabled = current <= 1; // 判断上一题按钮是否禁用
      const nextBtnDisabled = false; // 下一题按钮启用状态
      const subject = this.data.titles[current - 1]; // 获取当前题目
      const selected = this.data.selected.filter(option => subject.options.includes(option)); // 过滤出用户选择的答案中在当前题目选项中存在的答案
      this.setData({
        current,
        subject,
        prevBtnDisabled,
        nextBtnDisabled,
        selected,
      });
    },
    
    // 下一题按钮点击事件
    nextQuestion() {
      const current = this.data.current + 1; // 获取当前题目序号
      const prevBtnDisabled = false; // 上一题按钮启用状态
      const nextBtnDisabled = current >= this.data.total; // 判断下一题按钮是否禁用
      const subject = this.data.titles[current - 1]; // 获取当前题目
      const selected = this.data.selected.filter(option => subject.options.includes(option)); // 过滤出用户选择的答案中在当前题目选项中存在的答案
      this.setData({
        current,
        subject,
        prevBtnDisabled,
        nextBtnDisabled,
        selected,
      });
    },
    
    // 多选题选择事件，修改radioChange为checkboxChange
    checkboxChange(e) {
      console.log('用户选择的答案为：', e.detail.value);
      this.setData({
        selected: e.detail.value
      });
    },   
    
    submit() { // 用户提交答案时执行
        let num = this.data.current; // 当前题目序号
        let subject = this.data.subject; // 当前题目
        if (!this.data.selected.length) { // 用户未选择选项时
          wx.showToast({
            title: '请选择',
            icon: 'none'
          });
          return;
        }
      
        if (num < this.data.titles.length) { // 判断是否为最后一题
          this.setData({
            current: num + 1, // 更新当前题目序号
            subject: this.data.titles[num], // 更新当前题目
          });
        }
      
        console.log('用户选项', this.data.selected); // 输出用户选择的答案
        console.log('正确答案', subject.answr); // 输出当前题目的正确答案
      
        // 判断用户选择的答案是否正确，并且更新得分
        let isCorrect = true; // 用于判断用户答案是否完全正确
        for (let i = 0; i < this.data.selected.length; i++) {
          if (!subject.answr.includes(this.data.selected[i])) { // 用户选择的答案中有错误选项
            isCorrect = false;
            break;
          }
        }
        if (isCorrect) { // 用户选择的答案全部正确
          this.setData({
            score: this.data.score + 20 // 每题得分20分
          });
        } else { // 用户选择的答案不完全正确
          // 添加用户错题到错题集
          let errorOptions = this.data.errorOptions;
          errorOptions.push(subject);
          this.setData({
            errorOptions: errorOptions
          });
        }
      
        // 更新当前题目用户选择的答案
        subject.userSelect = this.data.selected;
      
        // 判断是否是最后一题，如果是则显示得分
        if (num == this.data.titles.length) {
          if (!this.data.scoreShown) { // 确保只显示一次得分
            wx.showModal({
              title: '提交得分',
              content: '您的得分为' + this.data.score + '分，是否查看错题集？',
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/errorOptions/errorOptions?errorOptions=' + JSON.stringify(this.data.errorOptions)
                  });
                }
                // 在这里添加保存数据到本地的代码
                wx.setStorageSync('errorOptions', this.data.errorOptions);
                // app.globalData.globalErrorOptions=this.data.errorOptions
                this.setData({
                  scoreShown: true,
                  submitDisabled: true,
                });
              }
            });
          }
        }
      
        // 更新进度条的百分比
        this.setData({
          progressPercent: (num / this.data.titles.length * 100).toFixed(2)
        });
      }
    })      