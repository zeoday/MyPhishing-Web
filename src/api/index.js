import request from './request'

// ========== 统计数据接口 ==========
export const statsApi = {
  getDashboardStats(timeRange) {
    return request.get('/web/dashboard', { params: { timeRange } })
  }
}

// ========== 邮件管理接口 ==========
export const emailApi = {
  getEmailList(params) {
    return request.get('/web/emaildata', { params })
  }
}

// ========== 向量检索接口 ==========
export const vectorApi = {
  getVectorStats() {
    return request.get('/web/vectordata')
  },
  searchSimilarEmails(params) {
    return request.post('/web/vectordata', params)
  }
}

// ========== AI分析接口 ==========
export const aiApi = {
  analyzeEmail(params) {
    return request.post('/web/aidata', params)
  }
}

// ========== 配置管理接口 ==========
export const settingApi = {
  getConfig() {
    return request.get('/web/setting')
  },
  saveConfig(config) {
    return request.post('/web/setting', config)
  },
  resetConfig() {
    return request.post('/web/setting', { action: 'reset' })
  }
}

// ========== 授权管理接口 ==========
export const licenseApi = {
  getMachineId() {
    return request.get('/utils/machine-id')
  },
  getLicenseStatus() {
    return request.get('/utils/status')
  },
  activateLicense(params) {
    return request.post('/utils/activate', params)
  }
}
