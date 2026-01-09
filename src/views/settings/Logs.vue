<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 overflow-hidden font-sans">
    <header class="h-16 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 relative z-[1000]">
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
            @click="mode = 'live'; handleModeChange()"
            :class="['px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-tighter', mode === 'live' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300']"
          >
            LIVE 流模式
          </button>
          <button
            @click="mode = 'history'; handleModeChange()"
            :class="['px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-tighter', mode === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300']"
          >
            HISTORY 历史
          </button>
        </div>

        <div class="relative dropdown-container">
          <button
            @click.stop="toggleDownloadMenu"
            class="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Download class="w-4 h-4" />
            导出数据
          </button>
          
          <transition name="dropdown">
            <div 
              v-if="showDownloadMenu" 
              class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[1100] backdrop-blur-xl"
            >
              <div class="px-4 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">选择导出类型</div>
              <button
                v-for="type in downloadTypes" 
                :key="type"
                @click="handleDownload(type)"
                class="w-full px-4 py-3 text-left text-slate-300 hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center justify-between group"
              >
                <span class="flex items-center gap-3">
                  <Document class="w-4 h-4 text-slate-500 group-hover:text-white" />
                  {{ type.toUpperCase() }} 日志文件
                </span>
                <span class="text-[10px] opacity-50">.LOG</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <div class="bg-slate-900/50 backdrop-blur-md p-4 border-b border-slate-800/50 flex flex-wrap items-center gap-4 px-6 relative z-[900]">
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
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
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
        <label v-if="mode === 'live'" class="flex items-center gap-2 text-[11px] text-slate-500 font-bold cursor-pointer hover:text-slate-300 transition-colors">
          <input type="checkbox" v-model="autoScroll" class="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0" />
          自动滚动
        </label>
        <button 
          @click="handleRefresh" 
          class="p-2 text-slate-400 hover:text-blue-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all"
          title="重新加载数据"
        >
          <Refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button 
          @click="clearLogs" 
          class="px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-400/10 border border-slate-700/50 rounded-lg transition-all uppercase"
        >
          清空显示
        </button>
      </div>
    </div>

    <main class="flex-1 bg-[#05070a] relative overflow-hidden flex flex-col">
      <div v-if="loading" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-xs font-bold text-blue-500 tracking-widest uppercase animate-pulse">正在同步数据...</span>
        </div>
      </div>

      <RecycleScroller
        ref="scrollerRef"
        class="flex-1 p-4 font-mono text-[13px] scrollbar-custom"
        :items="displayLogs"
        :item-size="50" 
        key-field="id"
        v-slot="{ item }"
      >
        <div 
          class="group flex flex-col md:flex-row gap-2 md:gap-4 px-4 py-3 mb-2 rounded-lg border-l-4 transition-all duration-200"
          :class="levelStyle(item.level)"
        >
          <div class="flex items-center gap-2 shrink-0 md:w-48">
            <Clock class="w-3.5 h-3.5 opacity-30" />
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
      </RecycleScroller>
      
      <div v-if="!loading && displayLogs.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-800">
        <div class="relative mb-6">
          <Document class="w-24 h-24 opacity-[0.03]" />
          <Search class="w-8 h-8 absolute bottom-0 right-0 opacity-10 animate-bounce" />
        </div>
        <p class="text-sm font-bold uppercase tracking-[0.2em] opacity-40">No Log Records Found</p>
        <p class="text-xs opacity-20 mt-2">请尝试调整过滤器设置或检查系统推送服务</p>
      </div>
    </main>

    <footer v-if="mode === 'history'" class="h-14 border-t border-slate-800/50 bg-slate-900/95 flex items-center px-8 justify-between shrink-0">
      <div class="flex items-center gap-4">
        <div class="text-[11px] text-slate-500 uppercase font-bold tracking-widest">
          查询结果: <span class="text-blue-400 ml-1">{{ total }}</span>
        </div>
      </div>
      
      <el-pagination 
        v-model:current-page="page" 
        :page-size="pageSize" 
        :total="total" 
        layout="prev, pager, next, jumper" 
        small 
        background 
        @current-change="loadHistory" 
      />
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { Download, Refresh, Loading, Document, Search, ArrowDown, Clock } from '@element-plus/icons-vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

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
const scrollerRef = ref(null)

// 下拉菜单控制
const showDownloadMenu = ref(false)
const downloadTypes = ['all', 'error', 'info', 'warning']

// 过滤器状态：核心修复 - 初始化时间字段
const filters = reactive({
  service: 'all',
  level: 'all',
  keyword: '',
  startTime: '',
  endTime: ''
})

let es = null
let statsTimer = null

/**
 * 格式化日志列表数据
 */
const displayLogs = computed(() => {
  const source = mode.value === 'live' ? logs.value : historyLogs.value
  return source.map((item, idx) => ({ 
    ...item, 
    id: item.id || `${mode.value}-${idx}-${item.timestamp}` 
  }))
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
  const d = new Date(ts)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${d.getMilliseconds().toString().padStart(3, '0')}`
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
 * 初始化 SSE 实时流
 */
const initSSE = () => {
  if (es) es.close()
  const params = new URLSearchParams()
  if (filters.service !== 'all') params.append('service', filters.service)
  if (filters.level !== 'all') params.append('level', filters.level)
  
  es = new EventSource(`${API_BASE}/stream?${params.toString()}`)
  
  es.onmessage = (e) => {
    if (e.data.includes('heartbeat')) return
    try {
      const data = JSON.parse(e.data)
      logs.value.push(data)
      // 保持缓冲区大小在 2000 条左右，防止内存溢出
      if (logs.value.length > 2500) logs.value.splice(0, 500)
      if (autoScroll.value) nextTick(scrollToBottom)
    } catch (err) {
      console.error('SSE JSON 解析错误:', err)
    }
  }

  es.onerror = () => {
    console.warn('SSE 连接断开，尝试自动重连...')
  }
}

/**
 * 加载历史数据：修复核心逻辑 - 增加时间格式化
 */
const loadHistory = async () => {
  loading.value = true
  try {
    const p = new URLSearchParams({
      page: page.value,
      page_size: pageSize.value,
      service: filters.service,
      level: filters.level,
      keyword: filters.keyword
    })

    // 格式化时间为 ISO 格式供后端读取
    if (filters.startTime) p.append('start_time', new Date(filters.startTime).toISOString())
    if (filters.endTime) p.append('end_time', new Date(filters.endTime).toISOString())

    const res = await fetch(`${API_BASE}/history?${p.toString()}`)
    const json = await res.json()
    
    if (json.success) {
      historyLogs.value = json.data.logs
      total.value = json.data.total
    }
  } catch (e) {
    console.error('历史记录加载失败:', e)
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
    if (json.success) stats.value = json.data
  } catch (e) {}
}

/**
 * 处理文件下载：通过 window.open 避免权限拦截
 */
const handleDownload = (type) => {
  showDownloadMenu.value = false
  const downloadUrl = `${API_BASE}/download?type=${type}&t=${Date.now()}`
  window.open(downloadUrl, '_blank')
}

/**
 * 模式切换逻辑处理
 */
const handleModeChange = () => {
  if (mode.value === 'live') {
    historyLogs.value = []
    initSSE()
  } else {
    if (es) es.close()
    page.value = 1
    loadHistory()
  }
}

/**
 * 过滤器变更触发器
 */
const onFilterChange = () => {
  page.value = 1
  if (mode.value === 'live') {
    logs.value = []
    initSSE()
  } else {
    loadHistory()
  }
  loadStats()
}

/**
 * 手动刷新
 */
const handleRefresh = () => onFilterChange()

/**
 * 清除本地显示
 */
const clearLogs = () => {
  if (mode.value === 'live') logs.value = []
  else historyLogs.value = []
}

/**
 * 滚动逻辑
 */
const scrollToBottom = () => {
  if (scrollerRef.value) {
    const el = scrollerRef.value.$el
    el.scrollTop = el.scrollHeight
  }
}

// ================= 生命周期控制 =================
onMounted(() => {
  initSSE()
  loadStats()
  
  // 轮询统计数据（每30秒）
  statsTimer = setInterval(loadStats, 30000)
  
  // 全局点击监听，关闭下拉菜单
  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      showDownloadMenu.value = false
    }
  }
  window.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
    if (es) es.close()
    if (statsTimer) clearInterval(statsTimer)
  })
})

// 监听模式，切换时自动重置滚动条
watch(mode, () => {
  nextTick(() => {
    if (scrollerRef.value) scrollerRef.value.$el.scrollTop = 0
  })
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar-custom::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar-custom::-webkit-scrollbar-track { background: #05070a; }
.scrollbar-custom::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 1px solid #0f172a; }
.scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #334155; }

/* 菜单动画 */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }

/* 日历选择器图标变亮 */
.inv-calendar-picker::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  cursor: pointer;
}

/* 覆盖 Element Plus 分页背景 */
:deep(.el-pagination.is-background .el-pager li) {
  background-color: transparent !important;
  color: #64748b !important;
  border: 1px solid #1e293b !important;
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #2563eb !important;
  color: white !important;
  border-color: #2563eb !important;
}
:deep(.el-pagination .el-input__wrapper) {
  background-color: #0f172a !important;
  box-shadow: none !important;
  border: 1px solid #1e293b !important;
}
:deep(.el-pagination .el-input__inner) {
  color: #e2e8f0 !important;
}

/* 强制高亮背景 */
mark { background-color: #3b82f6; color: white; border-radius: 2px; }
</style>