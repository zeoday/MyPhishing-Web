<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 overflow-hidden font-sans">
    <header class="h-16 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 relative z-[1000]">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h2 class="text-lg font-semibold text-slate-200 tracking-wide">LOG MONITOR</h2>
        </div>
        
        <div class="flex items-center gap-6 text-sm tabular-nums">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">今日总计</span>
            <span class="font-semibold text-emerald-400">{{ stats.today_count || 0 }}</span>
          </div>
          <div class="flex items-center gap-2" v-if="stats.by_level">
            <span class="text-slate-500">错误</span>
            <span class="font-semibold text-red-400">{{ stats.by_level.ERROR || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            @click="mode = 'live'; handleModeChange()"
            :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-all', mode === 'live' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200']"
          >实时监控</button>
          <button
            @click="mode = 'history'; handleModeChange()"
            :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-all', mode === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200']"
          >历史回溯</button>
        </div>

        <div class="relative dropdown-container">
          <button
            @click.stop="toggleDownloadMenu"
            class="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download class="w-4 h-4" /> 导出日志
          </button>
          
          <transition name="fade">
            <div v-if="showDownloadMenu" class="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[1001]">
              <button
                v-for="type in downloadTypes" :key="type"
                @click="handleDownload(type)"
                class="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 border-b border-slate-700 last:border-0"
              >
                <Document class="w-4 h-4 text-blue-400" /> {{ type.toUpperCase() }} Log
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <div class="bg-slate-900/50 backdrop-blur-sm p-3 border-b border-slate-800/50 flex flex-wrap items-center gap-4 px-6 relative z-[900]">
      <div class="flex items-center gap-2">
        <select v-model="filters.service" @change="onFilterChange" class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500">
          <option value="all">全部服务</option>
          <option v-for="(count, service) in stats.by_service" :key="service" :value="service">{{ service }}</option>
        </select>

        <select v-model="filters.level" @change="onFilterChange" class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500">
          <option value="all">全部级别</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      <div class="relative flex-1 max-w-xs">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input v-model="filters.keyword" @keyup.enter="onFilterChange" placeholder="搜索关键词..." class="pl-9 pr-3 py-1.5 w-full bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
      </div>

      <div v-if="mode === 'history'" class="flex items-center gap-2 bg-slate-800/30 p-1 rounded-md border border-slate-700/50">
        <input type="datetime-local" v-model="filters.startTime" @change="onFilterChange" class="bg-transparent text-sm text-slate-200 focus:outline-none px-2" />
        <span class="text-slate-600">-</span>
        <input type="datetime-local" v-model="filters.endTime" @change="onFilterChange" class="bg-transparent text-sm text-slate-200 focus:outline-none px-2" />
      </div>

      <div class="flex items-center gap-3 ml-auto">
        <label v-if="mode === 'live'" class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" v-model="autoScroll" class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600" />
          自动滚动
        </label>
        <button @click="handleRefresh" class="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
          <Refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button @click="clearLogs" class="text-sm text-slate-500 hover:text-red-400 px-2">清空</button>
      </div>
    </div>

    <main class="flex-1 bg-black/95 relative overflow-hidden flex flex-col">
      <div v-if="loading" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Loading class="w-10 h-10 animate-spin text-blue-500" />
      </div>

      <RecycleScroller
        ref="scrollerRef"
        class="flex-1 p-2 font-mono text-[13px] scrollbar-custom"
        :items="displayLogs"
        :item-size="32" 
        key-field="id"
        v-slot="{ item }"
      >
        <div 
          class="log-row flex gap-3 px-3 py-1.5 mb-[2px] rounded border-l-4 transition-colors"
          :class="levelStyle(item.level)"
        >
          <span class="text-slate-500 shrink-0 w-44 tabular-nums">{{ formatTimestamp(item.timestamp) }}</span>
          <span class="font-bold shrink-0 w-20 text-xs uppercase flex items-center justify-center rounded bg-black/30 border border-white/10">{{ item.level }}</span>
          <span class="text-blue-400/80 shrink-0 font-semibold truncate max-w-[120px]">[{{ item.service }}]</span>
          <div class="flex-1 whitespace-pre-wrap break-all leading-relaxed text-slate-300" v-html="highlightKeyword(item.message)"></div>
        </div>
      </RecycleScroller>
      
      <div v-if="!loading && displayLogs.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
        <Document class="w-12 h-12 mb-2 opacity-20" />
        <p>未找到相关日志数据</p>
      </div>
    </main>

    <footer v-if="mode === 'history'" class="h-12 border-t border-slate-800 bg-slate-900/90 flex items-center px-6 justify-between shrink-0">
      <div class="text-xs text-slate-500">共 <span class="text-blue-400 font-bold">{{ total }}</span> 条</div>
      <el-pagination 
        v-model:current-page="page" 
        :page-size="pageSize" 
        :total="total" 
        layout="prev, pager, next" 
        small 
        background 
        @current-change="loadHistory" 
      />
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { Download, Refresh, Loading, Document, Search, ArrowDown } from '@element-plus/icons-vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const API_BASE = '/api/logs'
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

const displayLogs = computed(() => {
  const source = mode.value === 'live' ? logs.value : historyLogs.value
  return source.map((item, idx) => ({ ...item, id: item.id || `${mode.value}-${idx}` }))
})

// 样式映射
const levelStyle = (lvl) => {
  const styles = {
    'ERROR': 'border-red-500 bg-red-500/10 text-red-200',
    'WARNING': 'border-yellow-500 bg-yellow-500/10 text-yellow-100',
    'INFO': 'border-blue-500 bg-blue-500/5 text-slate-300'
  }
  return styles[lvl] || 'border-slate-700 bg-slate-800/30'
}

const formatTimestamp = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

const highlightKeyword = (txt) => {
  if (!filters.keyword || !txt) return txt
  const reg = new RegExp(`(${filters.keyword})`, 'gi')
  return txt.replace(reg, '<mark class="bg-yellow-500/40 text-white rounded px-1">$1</mark>')
}

const toggleDownloadMenu = () => showDownloadMenu.value = !showDownloadMenu.value

const initSSE = () => {
  if (es) es.close()
  const p = new URLSearchParams({ service: filters.service, level: filters.level })
  es = new EventSource(`${API_BASE}/stream?${p.toString()}`)
  es.onmessage = (e) => {
    if (e.data.includes('heartbeat')) return
    const data = JSON.parse(e.data)
    logs.value.push(data)
    if (logs.value.length > 2000) logs.value.shift()
    if (autoScroll.value) nextTick(scrollToBottom)
  }
}

// 加载历史：已修复时间过滤参数
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
    // 关键修复：确保时间格式正确发送
    if (filters.startTime) p.append('start_time', new Date(filters.startTime).toISOString())
    if (filters.endTime) p.append('end_time', new Date(filters.endTime).toISOString())

    const res = await fetch(`${API_BASE}/history?${p.toString()}`)
    const json = await res.json()
    if (json.success) {
      historyLogs.value = json.data.logs
      total.value = json.data.total
    }
  } catch (e) { console.error('Load Error:', e) }
  finally { loading.value = false }
}

const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    const json = await res.json()
    if (json.success) stats.value = json.data
  } catch (e) {}
}

const handleDownload = (type) => {
  showDownloadMenu.value = false
  window.open(`${API_BASE}/download?type=${type}`, '_blank')
}

const handleModeChange = () => {
  if (mode.value === 'live') { historyLogs.value = []; initSSE() }
  else { if (es) es.close(); loadHistory() }
}

const onFilterChange = () => {
  page.value = 1
  mode.value === 'live' ? (logs.value = [], initSSE()) : loadHistory()
}

const handleRefresh = () => onFilterChange()
const clearLogs = () => mode.value === 'live' ? logs.value = [] : historyLogs.value = []
const scrollToBottom = () => {
  if (scrollerRef.value) {
    const el = scrollerRef.value.$el
    el.scrollTop = el.scrollHeight
  }
}

onMounted(() => {
  initSSE(); loadStats()
  statsTimer = setInterval(loadStats, 30000)
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) showDownloadMenu.value = false
  })
})

onUnmounted(() => {
  if (es) es.close()
  clearInterval(statsTimer)
})
</script>

<style scoped>
.scrollbar-custom::-webkit-scrollbar { width: 6px; }
.scrollbar-custom::-webkit-scrollbar-track { background: #0a0a0a; }
.scrollbar-custom::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 10px; }
.scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #4a5568; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* 日志行最小高度，防止虚拟滚动计算偏差 */
.log-row {
  min-height: 32px;
  align-items: flex-start;
}
</style>