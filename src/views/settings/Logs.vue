<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 overflow-hidden font-sans">
    <header class="h-16 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 relative z-[100]">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h2 class="text-lg font-semibold text-slate-200 tracking-wide">LOG MONITOR</h2>
        </div>
        
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">今日总计</span>
            <span class="font-mono font-semibold text-emerald-400">{{ stats.today_count || 0 }}</span>
          </div>
          <div class="flex items-center gap-2" v-if="stats.by_level">
            <span class="text-slate-500">严重错误</span>
            <span class="font-mono font-semibold text-red-400">{{ stats.by_level.ERROR || 0 }}</span>
          </div>
          <div class="flex items-center gap-2" v-if="stats.by_level">
            <span class="text-slate-500">警告</span>
            <span class="font-mono font-semibold text-yellow-400">{{ stats.by_level.WARNING || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            @click="mode = 'live'; handleModeChange()"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'live' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            实时监控
          </button>
          <button
            @click="mode = 'history'; handleModeChange()"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            历史回溯
          </button>
        </div>

        <div class="relative dropdown-container">
          <button
            @click.stop="toggleDownloadMenu"
            class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download class="w-4 h-4" />
            导出日志
          </button>
          
          <transition name="fade">
            <div 
              v-if="showDownloadMenu"
              class="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[9999]"
            >
              <button
                v-for="type in downloadTypes"
                :key="type"
                @click="handleDownload(type)"
                class="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 border-b border-slate-700 last:border-0"
              >
                <Document class="w-4 h-4 text-blue-400" />
                {{ type.charAt(0).toUpperCase() + type.slice(1) }} Log
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <div class="bg-slate-900/50 backdrop-blur-sm p-3 border-b border-slate-800/50 flex items-center justify-between px-6 relative z-50">
      <div class="flex gap-3 items-center">
        <select 
          v-model="filters.service" 
          @change="onFilterChange"
          class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">全部服务</option>
          <option 
            v-for="(count, service) in stats.by_service" 
            :key="service" 
            :value="service"
          >
            {{ service }} ({{ count }})
          </option>
        </select>

        <select 
          v-model="filters.level" 
          @change="onFilterChange"
          class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">全部级别</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>

        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            v-model="filters.keyword" 
            @keyup.enter="onFilterChange"
            placeholder="搜索关键词 (回车搜索)" 
            class="pl-9 pr-3 py-1.5 w-64 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div v-if="mode === 'history'" class="flex items-center gap-2">
          <input 
            type="datetime-local"
            v-model="filters.startTime"
            @change="onFilterChange"
            class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span class="text-slate-500 text-sm">至</span>
          <input 
            type="datetime-local"
            v-model="filters.endTime"
            @change="onFilterChange"
            class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer" v-if="mode === 'live'">
          <input 
            type="checkbox" 
            v-model="autoScroll"
            class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0"
          />
          自动滚动
        </label>
        <button 
          @click="handleRefresh"
          :disabled="loading"
          class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="刷新"
        >
          <Refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button 
          @click="clearLogs"
          class="px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
        >
          清空
        </button>
      </div>
    </div>

    <div class="flex-1 bg-black/95 relative overflow-hidden" id="log-viewport">
      <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <el-icon class="animate-spin text-blue-500" :size="40"><Loading /></el-icon>
          <span class="text-slate-400 text-sm">加载中...</span>
        </div>
      </div>

      <div v-if="!loading && displayLogs.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4 text-slate-600">
          <el-icon :size="60"><Document /></el-icon>
          <span class="text-lg">暂无日志数据</span>
          <span class="text-sm">{{ mode === 'live' ? '等待新日志推送...' : '尝试调整筛选条件' }}</span>
        </div>
      </div>

      <RecycleScroller
        v-else
        ref="scrollerRef"
        class="h-full p-3 font-mono text-[13px] leading-7 scrollbar-custom"
        :items="displayLogs"
        :item-size="28"
        key-field="id"
        v-slot="{ item }"
      >
        <div 
          class="flex gap-3 hover:bg-white/5 px-3 py-1 rounded transition-all duration-200 group border-l-2"
          :class="{
            'border-red-600 bg-red-950/20': item.level === 'ERROR',
            'border-yellow-600 bg-yellow-950/10': item.level === 'WARNING',
            'border-blue-600/30 bg-blue-950/5': item.level === 'INFO',
            'border-transparent': !['ERROR', 'WARNING', 'INFO'].includes(item.level)
          }"
        >
          <span class="text-slate-600 shrink-0 w-40 tabular-nums">{{ formatTimestamp(item.timestamp) }}</span>
          <span 
            class="font-bold shrink-0 w-20 uppercase text-center rounded px-2" 
            :class="levelBadgeClass(item.level)"
          >
            {{ item.level }}
          </span>
          <span class="text-blue-400/90 shrink-0 w-24 truncate font-semibold">[{{ item.service }}]</span>
          <span 
            class="text-slate-300 flex-1 break-all" 
            v-html="highlightKeyword(item.message)"
          ></span>
        </div>
      </RecycleScroller>

      <transition name="fade">
        <div 
          v-if="mode === 'live' && !autoScroll && newLogsCount > 0"
          class="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-2xl cursor-pointer hover:bg-blue-500 transition-all z-[100]"
          @click="scrollToBottom"
        >
          <span class="flex items-center gap-2">
            <el-icon class="animate-bounce"><ArrowDown /></el-icon>
            有 {{ newLogsCount }} 条新日志
          </span>
        </div>
      </transition>
    </div>

    <footer 
      v-if="mode === 'history'" 
      class="h-14 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-xl flex items-center px-6 justify-between shrink-0"
    >
      <span class="text-sm text-slate-400">
        找到 <span class="text-emerald-400 font-bold">{{ total }}</span> 条记录，
        显示第 <span class="text-blue-400 font-bold">{{ (page - 1) * pageSize + 1 }}</span> 
        到 <span class="text-blue-400 font-bold">{{ Math.min(page * pageSize, total) }}</span> 条
      </span>
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        small
        @current-change="loadHistory"
        background
      />
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { 
  Download, Refresh, Delete, Loading, Document, Clock, 
  Search, Grid, ArrowDown 
} from '@element-plus/icons-vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// API 配置
const API_BASE = '/api/logs'

// 简单的消息提示函数
const showMessage = (message, type = 'info') => {
  const toast = document.createElement('div')
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  toast.className = `fixed top-20 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-2xl z-[10000] animate-slide-down`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translate(-50%, -20px)'
    setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast) }, 300)
  }, 3000)
}

// 简单的通知函数
const showNotification = (title, message, type = 'info') => {
  const notif = document.createElement('div')
  const colors = {
    success: 'border-emerald-500 bg-emerald-950',
    error: 'border-red-500 bg-red-950',
    warning: 'border-yellow-500 bg-yellow-950',
    info: 'border-blue-500 bg-blue-950'
  }
  notif.className = `fixed top-20 left-1/2 -translate-x-1/2 ${colors[type]} border-l-4 text-white p-4 rounded-lg shadow-2xl z-[10000] max-w-md animate-slide-down`
  notif.innerHTML = `
    <div class="font-bold mb-1">${title}</div>
    <div class="text-sm text-slate-300">${message}</div>
  `
  document.body.appendChild(notif)
  setTimeout(() => {
    notif.style.opacity = '0'
    notif.style.transform = 'translate(-50%, -20px)'
    setTimeout(() => { if (document.body.contains(notif)) document.body.removeChild(notif) }, 300)
  }, 4000)
}

// 状态数据
const mode = ref('live')
const logs = ref([])
const historyLogs = ref([])
const stats = ref({ today_count: 0, by_level: {}, by_service: {}, total: 0 })
const loading = ref(false)
const autoScroll = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(100)
const newLogsCount = ref(0)
const scrollerRef = ref(null)

// 导出下载菜单控制
const showDownloadMenu = ref(false)
const downloadTypes = ['all', 'error', 'info', 'warning']

const filters = reactive({
  service: 'all',
  level: 'all',
  keyword: '',
  startTime: '',
  endTime: ''
})

let es = null
let statsTimer = null

// 计算属性
const displayLogs = computed(() => {
  const source = mode.value === 'live' ? logs.value : historyLogs.value
  return source.map((item, index) => ({ 
    ...item, 
    id: item.id || `${mode.value}-${index}-${item.timestamp}` 
  }))
})

// 工具函数
const toggleDownloadMenu = () => {
  showDownloadMenu.value = !showDownloadMenu.value
}

const levelBadgeClass = (level) => {
  const maps = {
    'ERROR': 'bg-red-500/20 text-red-400 border border-red-500/50',
    'WARNING': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    'INFO': 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
  }
  return maps[level] || 'bg-slate-500/20 text-slate-400'
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  })
}

const highlightKeyword = (text) => {
  if (!filters.keyword || !text) return text
  const reg = new RegExp(`(${filters.keyword})`, 'gi')
  return text.replace(reg, '<span class="bg-yellow-500/60 text-white px-1 rounded">$1</span>')
}

// SSE 实时流
const initSSE = () => {
  if (es) es.close()
  const params = new URLSearchParams()
  if (filters.service !== 'all') params.append('service', filters.service)
  if (filters.level !== 'all') params.append('level', filters.level)
  
  es = new EventSource(`${API_BASE}/stream?${params.toString()}`)
  es.onmessage = (event) => {
    if (event.data.includes('heartbeat')) return
    try {
      const data = JSON.parse(event.data)
      if (data.level === 'ERROR') showNotification('检测到错误', data.message.substring(0, 100), 'error')
      logs.value.push(data)
      if (logs.value.length > 3000) logs.value = logs.value.slice(-2000)
      if (autoScroll.value) nextTick(() => scrollToBottom())
      else newLogsCount.value++
    } catch (e) { console.error(e) }
  }
}

// 加载历史
const loadHistory = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, page_size: pageSize.value })
    if (filters.service !== 'all') params.append('service', filters.service)
    if (filters.level !== 'all') params.append('level', filters.level)
    if (filters.keyword) params.append('keyword', filters.keyword)
    const res = await fetch(`${API_BASE}/history?${params.toString()}`)
    const result = await res.json()
    if (result.success) {
      historyLogs.value = result.data.logs
      total.value = result.data.total
    }
  } catch (e) { showMessage('网络错误', 'error') }
  finally { loading.value = false }
}

const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    const result = await res.json()
    if (result.success) stats.value = result.data
  } catch (e) { console.error(e) }
}

const handleDownload = (type) => {
  showDownloadMenu.value = false
  const url = `${API_BASE}/download?type=${type}`
  const a = document.createElement('a')
  a.href = url
  a.download = `${type}_logs.log`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  showMessage(`导出 ${type} 日志中...`, 'success')
}

const handleModeChange = () => {
  if (mode.value === 'live') { historyLogs.value = []; initSSE() }
  else { if (es) es.close(); page.value = 1; loadHistory() }
}

const onFilterChange = () => {
  page.value = 1; newLogsCount.value = 0
  mode.value === 'live' ? (logs.value = [], initSSE()) : loadHistory()
  loadStats()
}

const handleRefresh = () => onFilterChange()
const clearLogs = () => {
  if (mode.value === 'live') { logs.value = []; newLogsCount.value = 0 }
  else historyLogs.value = []
}

const scrollToBottom = () => {
  if (scrollerRef.value) {
    const scroller = scrollerRef.value.$el
    scroller.scrollTop = scroller.scrollHeight
  }
  newLogsCount.value = 0
}

watch(autoScroll, (val) => { if (val) nextTick(() => scrollToBottom()) })

onMounted(() => {
  initSSE(); loadStats()
  statsTimer = setInterval(loadStats, 30000)
  
  // 核心修复：点击外部关闭菜单
  const closeMenuOnClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      showDownloadMenu.value = false
    }
  }
  window.addEventListener('click', closeMenuOnClickOutside)
  onUnmounted(() => window.removeEventListener('click', closeMenuOnClickOutside))
})

onUnmounted(() => {
  if (es) es.close()
  if (statsTimer) clearInterval(statsTimer)
})
</script>

<style scoped>
@keyframes slide-down {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
.animate-slide-down { animation: slide-down 0.3s ease-out; }

.scrollbar-custom::-webkit-scrollbar { width: 8px; height: 8px; }
.scrollbar-custom::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
.scrollbar-custom::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #3b82f6 !important;
}
</style>