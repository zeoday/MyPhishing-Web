import request from './request'

// ========== 统计数据接口 ==========
export const statsApi = {
  /**
   * 获取仪表盘统计数据 (包含趋势和最近记录)
   * @param {string} timeRange - 时间范围 (如 '12h', '7d', 或自定义时间戳范围 'start-end')
   */
  getDashboardStats(timeRange) {
    // ----------------------------------------------------------------------
    // 关键修改: 接受 timeRange 参数，并将其作为 URL 查询参数 (Query Parameter) 发送
    // Axios 使用 params 选项来处理 GET 请求的查询参数。
    // 最终生成的 URL 可能是: /api/web/dashboard?timeRange=12h
    // ----------------------------------------------------------------------
    return request.get('/api/web/dashboard', { params: { timeRange } })
  }
}


// ========== 邮件管理接口 ==========
export const emailApi = {
  // 获取邮件列表
  getEmailList(params) {
    return request.get('/api/web/emaildata', { params })
  }
}