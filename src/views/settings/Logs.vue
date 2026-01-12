<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans">
    <!-- 头部固定层 - 最高优先级 -->
    <header class="sticky top-0 z-[200] h-16 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h2 class="text-lg font-semibold text-slate-200 tracking-wide uppercase">System Log Monitor</h2>
        </div>
        
        <div class="flex items-center gap-6 text-sm tabular-nums">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 uppercase tracking-wider">今日总计</span>
            <span class="font-bold text-emerald-400 text-base leading-none">{{ stats.today_count || 0 }}</span>
          </div>
          <div class="flex flex-col" v-if="stats.by_level">
            <span class="text-[10px] text-slate-500 uppercase tracking-wider">异常错误</span>
            <span class="font-bold text-red-400 text-base leading-none">{{ stats.by_level.ERROR || 0 }}</span>
          </div>
          <div class="flex flex-col" v-if="stats.by_level">
            <span class="text-[10px] text-slate-500 uppercase tracking-wider">警告提醒</span>
            <span class="font-bold text-yellow-400 text-base leading-none">{{ stats.by_level.WARNING || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <button
            @click="switchMode('live')"
            :class="['px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-tighter', mode === 'live' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300']"
          >
            LIVE 流模式
          </button>
          <button
            @click="switchMode('history')"
            :class="['px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-tighter', mode === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300']"
          >
            HISTORY 历史
          </button>
        </div>

        <div class="relative" ref="dropdownContainer">
          <button
            @click.stop="toggleDownloadMenu"
            class="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出数据
          </button>
          
          <transition name="dropdown">
            <div 
              v-if="showDownloadMenu" 
              class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[210] backdrop-blur-xl"
            >
              <div class="px-4 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">选择导出类型</div>
              <button
                v-for="type in downloadTypes" 
                :key="type"
                @click="handleDownload(type)"
                class="w-full px-4 py-3 text-left text-slate-300 hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center justify-between group"
              >
                <span class="flex items-center gap-3">
                  <svg class="w-4 h-4 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ type.toUpperCase() }} 日志文件
                </span>
                <span class="text-[10px] opacity-50">.LOG</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- 过滤器栏 - 次高优先级 -->
    <div class="sticky top-16 z-[190] bg-slate-900/50 backdrop-blur-md p-4 border-b border-slate-800/50 flex flex-wrap items-center gap-4 px-6">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-500 uppercase ml-1">所属服务</span>
        <select 
          v-model="filters.service" 
          @change="onFilterChange" 
          class="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-w-[140px]"
        >
          <option value="all">所有服务实例</option>
          <option v-for="(count, service) in stats.by_service" :key="service" :value="service">
            {{ service }} ({{ count }})
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-500 uppercase ml-1">日志级别</span>
        <select 
          v-model="filters.level" 
          @change="onFilterChange" 
          class="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-w-[120px]"
        >
          <option value="all">所有级别</option>
          <option value="INFO" class="text-blue-400">INFO 信息</option>
          <option value="WARNING" class="text-yellow-400">WARNING 警告</option>
          <option value="ERROR" class="text-red-400">ERROR 错误</option>
        </select>
      </div>

      <div class="flex flex-col gap-1 flex-1 max-w-sm">
        <span class="text-[10px] font-bold text-slate-500 uppercase ml-1">关键词过滤</span>
        <div class="relative">
          <svg class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="filters.keyword" 
            @keyup.enter="onFilterChange" 
            placeholder="输入关键词按回车搜索..." 
            class="pl-9 pr-3 py-2 w-full bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div v-if="mode === 'history'" class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-500 uppercase ml-1">时间范围回溯</span>
        <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700 p-1 rounded-lg">
          <input 
            type="datetime-local" 
            v-model="filters.startTime" 
            @change="onFilterChange" 
            class="bg-transparent text-[11px] text-slate-200 focus:outline-none px-2 py-1 inv-calendar-picker" 
          />
          <span class="text-slate-600 text-xs">—</span>
          <input 
            type="datetime-local" 
            v-model="filters.endTime" 
            @change="onFilterChange" 
            class="bg-transparent text-[11px] text-slate-200 focus:outline-none px-2 py-1 inv-calendar-picker" 
          />
        </div>
      </div>

      <div class="flex items-center gap-3 ml-auto pt-5">
        <div v-if="mode === 'live'" class="flex items-center gap-3">
          <div :class="['flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold', sseConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10']">
            <div :class="['w-2 h-2 rounded-full', sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500']"></div>
            {{ sseConnected ? 'SSE 已连接' : 'SSE 断开' }}
          </div>
          <label class="flex items-center gap-2 text-[11px] text-slate-500 font-bold cursor-pointer hover:text-slate-300 transition-colors">
            <input type="checkbox" v-model="autoScroll" class="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0" />
            自动滚动
          </label>
        </div>
        <button 
          @click="handleRefresh" 
          class="p-2 text-slate-400 hover:text-blue-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all"
          title="重新加载数据"
        >
          <svg :class="['w-4 h-4', { 'animate-spin': loading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button 
          @click="clearLogs" 
          class="px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-400/10 border border-slate-700/50 rounded-lg transition-all uppercase"
        >
          清空显示
        </button>
      </div>
    </div>

    <!-- 主内容区域 - 受限滚动 -->
    <main class="flex-1 bg-[#05070a] relative min-h-0">
      <!-- 加载提示 -->
      <div v-if="loading" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-xs font-bold text-blue-500 tracking-widest uppercase animate-pulse">正在同步数据...</span>
        </div>
      </div>

      <!-- 日志列表滚动容器 -->
      <div 
        ref="scrollContainer"
        class="absolute inset-0 overflow-y-auto p-4 font-mono text-[13px] scrollbar-custom"
      >
        <div 
          v-for="(item, index) in displayLogs" 
          :key="item.id || `log-${index}`"
          class="group flex flex-col md:flex-row gap-2 md:gap-4 px-4 py-3 mb-2 rounded-lg border-l-4 transition-all duration-200"
          :class="levelStyle(item.level)"
        >
          <div class="flex items-center gap-2 shrink-0 md:w-48">
            <svg class="w-3.5 h-3.5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-slate-500 font-bold tabular-nums">{{ formatTimestamp(item.timestamp) }}</span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border"
              :class="badgeStyle(item.level)"
            >
              {{ item.level }}
            </span>
            <span class="text-blue-500/70 font-bold text-[11px] bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
              {{ item.service }}
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div 
              class="text-slate-300 whitespace-pre-wrap break-all leading-relaxed tracking-tight selection:bg-blue-500/30"
              v-html="highlightKeyword(item.message)"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- 空状态提示 -->
      <div v-if="!loading && displayLogs.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-800 pointer-events-none z-10">
        <div class="relative mb-6">
          <svg class="w-24 h-24 opacity-[0.03]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <svg class="w-8 h-8 absolute bottom-0 right-0 opacity-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p class="text-sm font-bold uppercase tracking-[0.2em] opacity-40">No Log Records Found</p>
        <p class="text-xs opacity-20 mt-2">{{ mode === 'live' ? '等待日志推送...' : '请尝试调整过滤器设置' }}</p>
        <button 
          v-if="mode === 'live' && !sseConnected"
          @click="reconnectSSE"
          class="mt-6 px-6 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-all pointer-events-auto"
        >
          重新连接 SSE
        </button>
        <button 
          v-else-if="mode === 'history'"
          @click="handleRefresh"
          class="mt-6 px-6 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-all pointer-events-auto"
        >
          重新加载数据
        </button>
      </div>
    </main>

    <!-- 底部分页 -->
    <footer v-if="mode === 'history'" class="sticky bottom-0 z-[180] h-14 border-t border-slate-800/50 bg-slate-900/95 flex items-center px-8 justify-between shrink-0">
      <div class="flex items-center gap-4">
        <div class="text-[11px] text-slate-500 uppercase font-bold tracking-widest">
          查询结果: <span class="text-blue-400 ml-1">{{ total }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          @click="page > 1 && (page--, loadHistory())"
          :disabled="page <= 1"
          class="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
        >
          上一页
        </button>
        
        <div class="flex items-center gap-1">
          <button
            v-for="p in visiblePages"
            :key="p"
            @click="page = p; loadHistory()"
            :class="['px-3 py-1 rounded text-xs border transition-all', p === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800']"
          >
            {{ p }}
          </button>
        </div>

        <button
          @click="page < totalPages && (page++, loadHistory())"
          :disabled="page >= totalPages"
          class="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
        >
          下一页
        </button>

        <div class="flex items-center gap-2 ml-4">
          <span class="text-xs text-slate-500">跳转至</span>
          <input 
            type="number" 
            v-model.number="jumpPage"
            @keyup.enter="handleJumpPage"
            min="1"
            :max="totalPages"
            class="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            @click="handleJumpPage"
            class="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs hover:bg-slate-700 transition-all"
          >
            GO
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'

/**
 * 后端 API 基础路径
 */
const API_BASE = '/api/logs'

// 核心状态控制
const mode = ref('live')
const logs = ref([])
const historyLogs = ref([])
const stats = ref({ today_count: 0, by_level: {}, by_service: {}, total: 0 })
const loading = ref(false)
const autoScroll = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(100)
const scrollContainer = ref(null)
const dropdownContainer = ref(null)
const jumpPage = ref(1)
const sseConnected = ref(false)

// 下拉菜单控制
const showDownloadMenu = ref(false)
const downloadTypes = ['celery', 'gateway', 'flask']

// 过滤器状态
const filters = reactive({
  service: 'all',
  level: 'all',
  keyword: '',
  startTime: '',
  endTime: ''
})

let es = null
let statsTimer = null
let reconnectTimer = null
let heartbeatTimer = null

/**
 * 格式化日志列表数据
 */
const displayLogs = computed(() => {
  const source = mode.value === 'live' ? logs.value : historyLogs.value
  return source.map((item, idx) => ({ 
    ...item, 
    id: item.id || `${mode.value}-${idx}-${item.timestamp || Date.now()}` 
  }))
})

/**
 * 计算总页数
 */
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

/**
 * 计算可见页码
 */
const visiblePages = computed(() => {
  const current = page.value
  const total = totalPages.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(total)
    }
  }
  
  return pages
})

/**
 * 样式逻辑映射：级别背景
 */
const levelStyle = (lvl) => {
  switch(lvl) {
    case 'ERROR': return 'border-red-600 bg-red-950/10 hover:bg-red-950/20'
    case 'WARNING': return 'border-yellow-600 bg-yellow-950/10 hover:bg-yellow-950/20'
    case 'INFO': return 'border-blue-600/30 bg-blue-950/5 hover:bg-blue-950/10'
    default: return 'border-slate-800 bg-slate-900/40'
  }
}

/**
 * 样式逻辑映射：级别标签
 */
const badgeStyle = (lvl) => {
  switch(lvl) {
    case 'ERROR': return 'bg-red-500/20 text-red-500 border-red-500/30'
    case 'WARNING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
    case 'INFO': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
    default: return 'bg-slate-700 text-slate-400 border-slate-600'
  }
}

/**
 * 格式化时间戳显示
 */
const formatTimestamp = (ts) => {
  if (!ts) return '--:--:--'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${d.getMilliseconds().toString().padStart(3, '0')}`
  } catch (e) {
    return ts
  }
}

/**
 * 搜索关键词高亮逻辑
 */
const highlightKeyword = (txt) => {
  if (!filters.keyword || !txt) return txt
  const escaped = filters.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const reg = new RegExp(`(${escaped})`, 'gi')
  return txt.replace(reg, '<mark class="bg-blue-500 text-white rounded px-0.5 mx-0.5">$1</mark>')
}

/**
 * 下拉菜单交互
 */
const toggleDownloadMenu = () => {
  showDownloadMenu.value = !showDownloadMenu.value
}

/**
 * 清理SSE连接
 */
const cleanupSSE = () => {
  if (es) {
    es.close()
    es = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = null
  }
  sseConnected.value = false
}

/**
 * 初始化 SSE 实时流 - 修复版
 */
const initSSE = () => {
  cleanupSSE()
  
  const params = new URLSearchParams()
  if (filters.service !== 'all') params.append('service', filters.service)
  if (filters.level !== 'all') params.append('level', filters.level)
  
  const url = `${API_BASE}/stream?${params.toString()}`
  console.log('[SSE] 连接到:', url)
  
  es = new EventSource(url)
  
  // 连接成功
  es.onopen = () => {
    console.log('[SSE] 连接成功')
    sseConnected.value = true
    
    // 重置心跳计时器
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    heartbeatTimer = setTimeout(() => {
      console.warn('[SSE] 30秒未收到心跳，标记为断开')
      sseConnected.value = false
    }, 30000)
  }
  
  // 接收消息
  es.onmessage = (e) => {
    // 重置心跳计时器
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    heartbeatTimer = setTimeout(() => {
      console.warn('[SSE] 30秒未收到心跳，标记为断开')
      sseConnected.value = false
    }, 30000)
    
    // 心跳包
    if (e.data.includes('heartbeat') || e.data.trim() === '') {
      console.log('[SSE] 收到心跳')
      return
    }
    
    // 解析日志数据
    try {
      const data = JSON.parse(e.data)
      if (data.error) {
        console.error('[SSE] 服务器错误:', data.error)
        return
      }
      
      console.log('[SSE] 收到日志:', data)
      logs.value.push(data)
      
      // 保持缓冲区大小
      if (logs.value.length > 2500) {
        logs.value.splice(0, 500)
      }
      
      // 自动滚动
      if (autoScroll.value) {
        nextTick(scrollToBottom)
      }
    } catch (err) {
      console.error('[SSE] JSON 解析错误:', err, e.data)
    }
  }

  // 连接错误
  es.onerror = (err) => {
    console.error('[SSE] 连接错误:', err)
    sseConnected.value = false
    cleanupSSE()
    
    // 自动重连（5秒后）
    reconnectTimer = setTimeout(() => {
      if (mode.value === 'live') {
        console.log('[SSE] 尝试重新连接...')
        initSSE()
      }
    }, 5000)
  }
}

/**
 * 手动重连SSE
 */
const reconnectSSE = () => {
  console.log('[SSE] 手动重连')
  logs.value = []
  initSSE()
}

/**
 * 加载历史数据
 */
const loadHistory = async () => {
  loading.value = true
  try {
    const p = new URLSearchParams({
      page: page.value,
      page_size: pageSize.value
    })

    if (filters.service !== 'all') p.append('service', filters.service)
    if (filters.level !== 'all') p.append('level', filters.level)
    if (filters.keyword) p.append('keyword', filters.keyword)
    
    if (filters.startTime) {
      try {
        p.append('start_time', new Date(filters.startTime).toISOString())
      } catch (e) {
        console.error('开始时间格式错误:', e)
      }
    }
    if (filters.endTime) {
      try {
        p.append('end_time', new Date(filters.endTime).toISOString())
      } catch (e) {
        console.error('结束时间格式错误:', e)
      }
    }

    console.log('[History] 加载历史数据:', p.toString())
    const res = await fetch(`${API_BASE}/history?${p.toString()}`)
    const json = await res.json()
    
    if (json.success) {
      historyLogs.value = json.data.logs || []
      total.value = json.data.total || 0
      jumpPage.value = page.value
      console.log('[History] 加载成功，共', total.value, '条记录')
    } else {
      console.error('[History] 加载失败:', json.error)
      historyLogs.value = []
      total.value = 0
    }
  } catch (e) {
    console.error('[History] 加载异常:', e)
    historyLogs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 加载统计指标
 */
const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    const json = await res.json()
    if (json.success) {
      stats.value = json.data || { today_count: 0, by_level: {}, by_service: {}, total: 0 }
      console.log('[Stats] 统计数据:', stats.value)
    }
  } catch (e) {
    console.error('[Stats] 加载失败:', e)
  }
}

/**
 * 处理文件下载
 */
const handleDownload = (type) => {
  showDownloadMenu.value = false
  const downloadUrl = `${API_BASE}/download?type=${type}&t=${Date.now()}`
  console.log('[Download] 下载:', downloadUrl)
  window.open(downloadUrl, '_blank')
}

/**
 * 模式切换逻辑处理
 */
const switchMode = (newMode) => {
  if (mode.value === newMode) return
  
  mode.value = newMode
  console.log('[Mode] 切换到:', newMode)
  
  if (newMode === 'live') {
    historyLogs.value = []
    logs.value = []
    cleanupSSE()
    initSSE()
  } else {
    cleanupSSE()
    logs.value = []
    page.value = 1
    loadHistory()
  }
}

/**
 * 过滤器变更触发器
 */
const onFilterChange = () => {
  console.log('[Filter] 过滤器变更:', filters)
  page.value = 1
  
  if (mode.value === 'live') {
    logs.value = []
    cleanupSSE()
    initSSE()
  } else {
    loadHistory()
  }
  loadStats()
}

/**
 * 手动刷新
 */
const handleRefresh = () => {
  console.log('[Refresh] 手动刷新')
  if (mode.value === 'live') {
    logs.value = []
    cleanupSSE()
    initSSE()
  } else {
    loadHistory()
  }
  loadStats()
}

/**
 * 清除本地显示
 */
const clearLogs = () => {
  console.log('[Clear] 清空日志')
  if (mode.value === 'live') {
    logs.value = []
  } else {
    historyLogs.value = []
  }
}

/**
 * 跳转到指定页
 */
const handleJumpPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    page.value = jumpPage.value
    loadHistory()
  }
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// ================= 生命周期控制 =================
onMounted(() => {
  console.log('[Lifecycle] 组件挂载')
  
  // 初始化时先加载统计信息
  loadStats()
  
  // 根据模式初始化数据
  if (mode.value === 'live') {
    initSSE()
  } else {
    loadHistory()
  }
  
  // 轮询统计数据（每30秒）
  statsTimer = setInterval(loadStats, 30000)
  
  // 全局点击监听，关闭下拉菜单
  const handleClickOutside = (e) => {
    if (dropdownContainer.value && !dropdownContainer.value.contains(e.target)) {
      showDownloadMenu.value = false
    }
  }
  window.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    console.log('[Lifecycle] 组件卸载')
    window.removeEventListener('click', handleClickOutside)
    cleanupSSE()
    if (statsTimer) clearInterval(statsTimer)
  })
})

// 监听模式切换，重置滚动条
watch(mode, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0
    }
  })
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar-custom::-webkit-scrollbar { 
  width: 6px; 
  height: 6px; 
}
.scrollbar-custom::-webkit-scrollbar-track { 
  background: #05070a; 
}
.scrollbar-custom::-webkit-scrollbar-thumb { 
  background: #1e293b; 
  border-radius: 10px; 
  border: 1px solid #0f172a; 
}
.scrollbar-custom::-webkit-scrollbar-thumb:hover { 
  background: #334155; 
}

/* 下拉菜单动画 */
.dropdown-enter-active, 
.dropdown-leave-active { 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
}
.dropdown-enter-from, 
.dropdown-leave-to { 
  opacity: 0; 
  transform: translateY(-10px) scale(0.95); 
}

/* 日历选择器图标变亮 */
.inv-calendar-picker::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  cursor: pointer;
}

/* 强制高亮背景 */
mark { 
  background-color: #3b82f6; 
  color: white; 
  border-radius: 2px; 
  padding: 0 2px;
}
</style>