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


// ========== 日志分析接口 ==========
export const logApi = {
  // 获取历史日志（带分页和过滤）
  getHistory(params) {
    return request.get('/logs/history', { params })
  },
  // 获取统计概览
  getStats() {
    return request.get('/logs/stats')
  },
  // 获取实时日志流地址 (供 EventSource 使用)
  getStreamUrl(service = 'all', level = 'all') {
    const baseUrl = import.meta.env.VITE_API_URL || ''
    return `${baseUrl}/logs/stream?service=${service}&level=${level}`
  },
  // 下载日志文件
  downloadLog(type) {
    window.open(`${import.meta.env.VITE_API_URL || ''}/logs/download?type=${type}`)
  }
}