import request from './request'

// ========== 统计数据接口 ==========
export const statsApi = {
  // 获取仪表盘统计
  getDashboardStats() {
    return request.get('/api/stats/dashboard')
  },
  
  // 获取威胁分布
  getThreatDistribution() {
    return request.get('/api/stats/threat_distribution')
  }
}

// ========== 邮件管理接口 ==========
export const emailApi = {
  // 保存邮件
  saveEmail(data) {
    return request.post('/api/email/save_email', data)
  },
  
  // 查询邮件
  queryEmail(email_id) {
    return request.post('/api/email/email_query', { email_id })
  },
  
  // 获取最近邮件列表
  getRecentList(limit = 10) {
    return request.post('/api/email/recent_list', { limit })
  },
  
  // 更新邮件风险
  updateEmailRisk(data) {
    return request.post('/api/email/update_email_risk', data)
  },
  
  // 更新沙箱结果
  updateSandboxResult(email_id, sandbox_result) {
    return request.post('/api/email/update_sandbox_result', { email_id, sandbox_result })
  }
}

// ========== 威胁检测接口 ==========
export const threatApi = {
  // VT威胁查询
  queryThreat(type, value) {
    return request.post('/api/threat/threat_query', { type, value })
  },
  
  // 沙箱检测
  sandboxQuery(email_id, type, value) {
    return request.post('/api/sandbox/sandbox_query', { email_id, type, value })
  }
}

// ========== AI 相关接口 ==========
export const aiApi = {
  // 邮件向量化
  emailToVector(email_id, subject, content_text) {
    return request.post('/api/ai/email_to_vector', { email_id, subject, content_text })
  },
  
  // 保存到向量库
  saveToChroma(email_id) {
    return request.post('/api/ai/save_email_to_chroma_by_id', { email_id })
  },
  
  // 向量搜索
  searchChroma(email_id, top_k = 5) {
    return request.post('/api/ai/search_chroma', { email_id, top_k })
  },
  
  // AI分析
  aiChat(email_id) {
    return request.post('/api/ai/aichat', { email_id })
  }
}