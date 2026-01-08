<template>
  <div class="flex flex-col h-screen bg-[#0a0f18] text-slate-200 overflow-hidden font-sans">
    <header class="h-16 border-b border-slate-800 bg-[#111827] flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-6">
        <h2 class="text-xl font-bold text-blue-400 tracking-tight">LOG MONITOR</h2>
        <div class="flex gap-4">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 uppercase">今日总计</span>
            <span class="text-sm font-mono text-emerald-400">{{ stats.today_count || 0 }}</span>
          </div>
          <div class="flex flex-col border-l border-slate-700 pl-4" v-if="stats.by_level">
            <span class="text-[10px] text-slate-500 uppercase">严重错误</span>
            <span class="text-sm font-mono text-red-500">{{ stats.by_level.ERROR || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <el-radio-group v-model="mode" size="small" @change="handleModeChange">
          <el-radio-button label="live">LIVE 实时</el-radio-button>
          <el-radio-button label="history">HISTORY 历史</el-radio-button>
        </el-radio-group>

        <el-dropdown trigger="click" @command="handleDownload">
          <el-button size="small" type="primary" plain :icon="Download">导出日志</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="flask">Flask App Log</el-dropdown-item>
              <el-dropdown-item command="celery">Celery Worker Log</el-dropdown-item>
              <el-dropdown-item command="gunicorn">Gunicorn Proxy Log</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="bg-[#111827]/50 p-3 border-b border-slate-800 flex items-center justify-between px-6">
      <div class="flex gap-3">
        <el-select v-model="filters.service" size="small" class="!w-32" @change="onFilterChange">
          <el-option label="所有服务" value="all" />
          <el-option v-for="(val, key) in stats.by_service" :key="key" :label="key" :value="key" />
        </el-select>

        <el-select v-model="filters.level" size="small" class="!w-28" @change="onFilterChange">
          <el-option label="所有级别" value="all" />
          <el-option label="INFO" value="INFO" />
          <el-option label="WARNING" value="WARNING" />
          <el-option label="ERROR" value="ERROR" />
        </el-select>

        <el-input 
          v-model="filters.keyword" 
          size="small" 
          placeholder="搜索关键词..." 
          class="!w-64"
          clearable
          @keyup.enter="onFilterChange"
        />
      </div>

      <div class="flex items-center gap-2">
        <el-checkbox v-underline v-model="isLocked" size="small">
          <span class="text-slate-400 italic">滚动锁定</span>
        </el-checkbox>
        <el-button :icon="Delete" size="small" text @click="clearLogs">清空屏幕</el-button>
      </div>
    </div>

    <div class="flex-1 bg-black relative overflow-hidden" id="log-viewport">
      <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
        <el-icon class="animate-spin text-blue-500" :size="30"><Loading /></el-icon>
      </div>

      <RecycleScroller
        class="h-full p-2 font-mono text-[13px] leading-6 scrollbar-custom"
        :items="displayLogs"
        :item-size="24"
        key-field="id"
        v-slot="{ item }"
      >
        <div class="flex gap-3 hover:bg-white/5 px-2 rounded group border-l-2 border-transparent" 
             :class="{'border-red-600 bg-red-900/10': item.level === 'ERROR'}">
          <span class="text-slate-600 shrink-0">{{ item.timestamp }}</span>
          <span class="font-bold shrink-0 w-16 uppercase" :class="levelClass(item.level)">{{ item.level }}</span>
          <span class="text-blue-400/80 shrink-0 w-20 truncate">[{{ item.service }}]</span>
          <span class="text-slate-300" v-html="highlightKeyword(item.message)"></span>
        </div>
      </RecycleScroller>
    </div>

    <footer v-if="mode === 'history'" class="h-12 border-t border-slate-800 bg-[#111827] flex items-center px-6 justify-between">
      <span class="text-xs text-slate-500">找到 {{ total }} 条记录</span>
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="loadHistory"
      />
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { Download, Refresh, Delete, Loading } from '@element-plus/icons-vue'
// Vue 3 引入方式
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { logApi } from '@/api'

// --- 状态数据 ---
const mode = ref('live')
const logs = ref([])           // 实时监控缓存 (Array)
const historyLogs = ref([])    // 历史回溯缓存 (Array)
const stats = ref({ today_count: 0, by_level: {}, by_service: {}, total: 0 })
const loading = ref(false)
const isLocked = ref(false)    // 是否禁止自动滚动
const total = ref(0)           // 历史总数
const page = ref(1)
const pageSize = ref(100)

const filters = reactive({
  service: 'all',
  level: 'all',
  keyword: '',
  dateRange: []
})

let es = null

// --- 计算属性：整合唯一 ID 用于虚拟滚动性能优化 ---
const displayLogs = computed(() => {
  const source = mode.value === 'live' ? logs.value : historyLogs.value
  return source.map((item, index) => ({ 
    ...item, 
    id: item.id || `${mode.value}-${index}-${item.timestamp}` 
  }))
})

const levelClass = (level) => {
  const maps = { 'ERROR': 'text-red-500', 'WARNING': 'text-yellow-500', 'INFO': 'text-blue-400' }
  return maps[level] || 'text-slate-400'
}

// 关键词高亮函数
const highlightKeyword = (text) => {
  if (!filters.keyword) return text
  const reg = new RegExp(`(${filters.keyword})`, 'gi')
  return text.replace(reg, '<span class="bg-yellow-500/40 text-white">$1</span>')
}

// --- 接口 1: 建立实时流 ---
const initSSE = () => {
  if (es) es.close()
  const url = logApi.getStreamUrl(filters.service, filters.level)
  es = new EventSource(url)

  es.onmessage = (event) => {
    if (event.data.includes('heartbeat')) return
    try {
      const data = JSON.parse(event.data)
      logs.value.push(data)
      
      // 自动清理，防止挂机时间过长导致浏览器内存崩溃
      if (logs.value.length > 2000) logs.value.shift()
      
      // 处理自动滚动
      if (!isLocked.value) {
        nextTick(() => {
          const scroller = document.querySelector('.vue-recycle-scroller')
          if (scroller) scroller.scrollTop = scroller.scrollHeight
        })
      }
    } catch (e) { console.error("解析流数据失败", e) }
  }
}

// --- 接口 2: 查询历史记录 ---
const loadHistory = async () => {
  loading.value = true
  try {
    const res = await logApi.getHistory({
      page: page.value,
      page_size: pageSize.value,
      service: filters.service === 'all' ? '' : filters.service,
      level: filters.level === 'all' ? '' : filters.level,
      keyword: filters.keyword
    })
    if (res.success) {
      historyLogs.value = res.data.logs
      total.value = res.data.total
    }
  } finally { loading.value = false }
}

// --- 接口 3: 获取统计信息 ---
const loadStats = async () => {
  const res = await logApi.getStats()
  if (res.success) stats.value = res.data
}

// --- 接口 4: 下载导出 ---
const handleDownload = (type) => {
  logApi.downloadLog(type)
}

// --- 动作控制 ---
const handleModeChange = () => {
  if (mode.value === 'live') {
    initSSE()
  } else {
    if (es) es.close()
    loadHistory()
  }
}

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

const clearLogs = () => {
  mode.value === 'live' ? (logs.value = []) : (historyLogs.value = [])
}

// 生命周期
onMounted(() => {
  initSSE()
  loadStats()
  // 每 30 秒轮询一次后端统计数据
  const timer = setInterval(loadStats, 30000)
  onUnmounted(() => {
    if (es) es.close()
    clearInterval(timer)
  })
})
</script>

<style scoped>
.scrollbar-custom::-webkit-scrollbar { width: 6px; }
.scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
.scrollbar-custom::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }

:deep(.el-input__wrapper) {
  background-color: #1e293b !important;
  box-shadow: none !important;
  border: 1px solid #334155 !important;
}
:deep(.el-input__inner) { color: #e2e8f0 !important; }
</style>