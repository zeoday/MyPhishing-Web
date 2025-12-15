<template>
  <div class="h-full flex flex-col space-y-3">
    
    <div class="flex justify-end pb-1 pt-2 flex-shrink-0">
      <div class="inline-flex items-center space-x-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl">
        <span class="text-xs text-slate-400">时间范围:</span>
        <select 
          v-model="timeRange" 
          class="bg-slate-800/50 text-white text-xs py-1 px-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 border-none transition duration-150 ease-in-out cursor-pointer"
          @change="handleTimeRangeChange"
        >
          <option value="12h">最近 12 小时</option>
          <option value="24h">最近 24 小时</option>
          <option value="3d">最近 3 天</option>
          <option value="7d">最近 7 天</option>
          <option value="custom">自定义时间</option>
        </select>
        
        <template v-if="timeRange === 'custom'">
             <span class="text-xs text-indigo-400">选择日期...</span>
        </template>
      </div>
    </div>

    <div class="flex-shrink-0 space-y-3">
        <div 
          :class="{'fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-3xl p-12': isMaximizedChart1, 
                   'bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-3': !isMaximizedChart1}"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <Activity class="w-5 h-5 text-indigo-400" />
              邮件处理趋势
            </h3>
            <button @click="toggleMaximize(1)" class="p-1 text-slate-400 hover:text-indigo-400 transition" :title="isMaximizedChart1 ? '退出全屏' : '全屏显示'">
              <component :is="isMaximizedChart1 ? Minimize2 : Maximize2" class="w-4 h-4" />
            </button>
          </div>
          
          <div ref="chartContainer" class="w-full" :style="isMaximizedChart1 ? { height: 'calc(100vh - 80px)' } : { height: '200px' }">
            <div v-if="loading" class="flex justify-center items-center h-full text-slate-400">
                <Loader2 class="w-6 h-6 animate-spin mr-2" />
                数据加载中...
            </div>
          </div>
        </div>
        
        <div 
          :class="{'fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-3xl p-12': isMaximizedChart2, 
                   'bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-3': !isMaximizedChart2}"
        >
           <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-red-400" />
              拦截与告警趋势
            </h3>
            <button @click="toggleMaximize(2)" class="p-1 text-slate-400 hover:text-indigo-400 transition" :title="isMaximizedChart2 ? '退出全屏' : '全屏显示'">
              <component :is="isMaximizedChart2 ? Minimize2 : Maximize2" class="w-4 h-4" />
            </button>
          </div>
          <div ref="actionChartContainer" class="w-full" :style="isMaximizedChart2 ? { height: 'calc(100vh - 80px)' } : { height: '140px' }">
            <div v-if="loading" class="flex justify-center items-center h-full text-slate-400">
                <Loader2 class="w-6 h-6 animate-spin mr-2" />
                数据加载中...
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
          <DashboardCard 
            v-for="card in summaryData" 
            :key="card.title" 
            :title="card.title" 
            :value="card.value" 
            :icon="card.icon" 
            :color="card.color"
          />
        </div>
    </div>
    
    <div v-if="!isMaximizedChart1 && !isMaximizedChart2" class="flex-grow min-h-0">
        <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 h-full flex flex-col">
          <h3 class="text-lg font-bold mb-2 flex items-center gap-2 flex-shrink-0">
            <Clock class="w-5 h-5 text-green-400" />
            最近检测记录
          </h3>
          
          <div class="flex-grow overflow-y-auto min-h-0">
            <table class="min-w-full divide-y divide-slate-700">
              <thead>
                <tr class="sticky top-0 bg-slate-900/90 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider z-0">
                  <th class="py-2 px-3">时间</th>
                  <th class="py-2 px-3">邮件 ID</th>
                  <th class="py-2 px-3">发件人</th>
                  <th class="py-2 px-3">检测结果</th>
                  <th class="py-2 px-3">处理状态</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr v-for="record in detectionRecords" :key="record.id" class="hover:bg-slate-800/30 transition duration-150">
                  <td class="py-1.5 px-3 text-xs text-slate-300">{{ record.time }}</td>
                  <td class="py-1.5 px-3 text-xs text-indigo-300 font-mono">{{ record.id }}</td>
                  <td class="py-1.5 px-3 text-xs text-slate-300 truncate max-w-xs">{{ record.sender }}</td>
                  <td class="py-1.5 px-3 text-xs">
                    <span :class="getResultClass(record.result)">
                      {{ record.result }}
                    </span>
                  </td>
                  <td class="py-1.5 px-3 text-xs text-slate-300">
                    <span :class="getStatusClass(record.status)">
                      {{ record.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!loading && detectionRecords.length === 0"><td colspan="5" class="text-center py-4 text-slate-400 text-sm">暂无检测记录</td></tr>
              </tbody>
            </table>
          </div>

          <div class="mt-2 flex justify-center flex-shrink-0">
            <button class="text-indigo-400 hover:text-indigo-300 text-sm py-1 px-3 rounded-lg transition duration-150">
              查看更多记录
            </button>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Activity, Mail, AlertTriangle, CheckCircle, HelpCircle, User, Clock, Loader2, Maximize2, Minimize2 } from 'lucide-vue-next'
import * as echarts from 'echarts' 

// --- 辅助组件：DashboardCard (为简洁，内联定义) ---
const DashboardCard = {
  props: ['title', 'value', 'icon', 'color'],
  template: `
    <div class="p-3 bg-slate-800/30 border border-slate-700 rounded-xl shadow-lg transition duration-300 hover:border-indigo-500/50">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium text-slate-400">{{ title }}</p>
        <component :is="icon" :class="['w-4 h-4', color]" />
      </div>
      <p class="text-xl font-extrabold text-white mt-1.5">{{ value.toLocaleString() }}</p>
    </div>
  `,
  components: { Mail, AlertTriangle, CheckCircle, HelpCircle, User } 
}
// ---------------------------------------------------

// --- 状态与数据 ---
const timeRange = ref('12h') // 默认值已设置为 12h
const chartContainer = ref(null)       
const actionChartContainer = ref(null) 
const loading = ref(true) // 默认为 true，等待 API 数据
let chartInstance = null               
let actionChartInstance = null         

const isMaximizedChart1 = ref(false)
const isMaximizedChart2 = ref(false)

// 核心：这些数组和对象应该被 fetchData() 从 API 返回的数据覆盖
const summaryData = ref([])     
const detectionRecords = ref([]) 

// --- 核心方法 ---

const handleTimeRangeChange = () => {
    if (timeRange.value !== 'custom') {
        fetchData();
    } else {
        // TODO: 在这里触发自定义日期范围选择器的显示逻辑
        console.log("自定义时间范围被选择。应显示日期选择器。");
    }
}

const toggleMaximize = (chartIndex) => {
    if (chartIndex === 1) {
        isMaximizedChart1.value = !isMaximizedChart1.value;
        if (isMaximizedChart1.value) isMaximizedChart2.value = false;
    } else if (chartIndex === 2) {
        isMaximizedChart2.value = !isMaximizedChart2.value;
        if (isMaximizedChart2.value) isMaximizedChart1.value = false;
    }

    nextTick(() => {
        if (chartInstance) chartInstance.resize();
        if (actionChartInstance) actionChartInstance.resize();
    });
}

// --- ECharts 初始化方法 (确保使用 API 返回的数据) ---
const initChart = (trendData) => {
    if (!chartContainer.value) return;
    if (!chartInstance) {
        chartInstance = echarts.init(chartContainer.value, 'dark', { renderer: 'svg' });
    }
    const formattedData = formatTrendData(trendData); // 使用 API 返回的数据格式化

    const option = {
        // ... ECharts 配置 ...
    };
    chartInstance.setOption(option, true); // true 确保覆盖旧配置
}

const initActionChart = (actionData) => {
    if (!actionChartContainer.value) return;
    if (!actionChartInstance) {
        actionChartInstance = echarts.init(actionChartContainer.value, 'dark', { renderer: 'svg' });
    }
    const formattedData = formatActionData(actionData); // 使用 API 返回的数据格式化

    const option = {
        // ... ECharts 配置 ...
    };
    actionChartInstance.setOption(option, true); // true 确保覆盖旧配置
}

// --- 数据格式化 (根据实际后端结构调整) ---
const formatTrendData = (trendData) => {
    // 假设 trendData 是 [{ timestamp: '...', total: 100, ... }, ...]
    // TODO: 替换为您的实际格式化逻辑
    return { timestamps: [], total: [], normal: [], phishing: [], suspicious: [], manual: [] };
}

const formatActionData = (actionData) => {
    // 假设 actionData 是 [{ timestamp: '...', blockCount: 10, alertCount: 5 }, ...]
    // TODO: 替换为您的实际格式化逻辑
    return { timestamps: [], block: [], alert: [] };
}


// 4. 数据获取 (对接后端 API)
const fetchData = async () => {
    loading.value = true;
    
    try {
        const params = new URLSearchParams({ timeRange: timeRange.value }).toString();
        // **!!! 替换为您的实际 API 调用 !!!**
        const response = await fetch(`/api/dashboard/data?${params}`); 
        const data = await response.json();

        // 1. 更新总览数据
        const backendSummary = data.summary || {};
        summaryData.value = [
            { title: '邮件总数', value: backendSummary.totalCount || 0, icon: Mail, color: 'text-indigo-400' },
            { title: '正常总数', value: backendSummary.normalCount || 0, icon: CheckCircle, color: 'text-green-400' },
            { title: '钓鱼邮件', value: backendSummary.phishingCount || 0, icon: AlertTriangle, color: 'text-red-400' },
            { title: '可疑总数', value: backendSummary.suspiciousCount || 0, icon: HelpCircle, color: 'text-yellow-400' },
            { title: '人工确认', value: backendSummary.manualCount || 0, icon: User, color: 'text-purple-400' },
        ];
        
        // 2. 更新图表数据
        initChart(data.trendData || []); 
        initActionChart(data.actionTrendData || []); 
        
        // 3. 更新表格数据
        detectionRecords.value = data.records || []; 

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // 如果 API 失败，清空数据
        summaryData.value = [];
        detectionRecords.value = [];
    } finally {
        loading.value = false;
    }
}

// 5. 表格样式辅助方法 (保持不变)
const getResultClass = (result) => {
    switch (result) {
        case '钓鱼邮件': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-800 text-red-300';
        case '正常邮件': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-800 text-green-300';
        case '可疑邮件': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-800 text-yellow-300';
        case '人工确认': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-800 text-purple-300';
        default: return 'text-slate-300';
    }
}

const getStatusClass = (status) => {
    switch (status) {
        case '已隔离': return 'text-red-400';
        case '已放行': return 'text-green-400';
        case '待人工确认': return 'text-yellow-400';
        default: return 'text-slate-400';
    }
}

// --- 生命周期与监听 ---
onMounted(() => {
    fetchData(); // 页面加载时默认获取 12h 数据
    
    // 监听窗口大小变化，重置图表尺寸
    window.addEventListener('resize', () => {
        if (chartInstance) chartInstance.resize();
        if (actionChartInstance) actionChartInstance.resize();
    });
});
</script>

<style scoped>
/* 确保 min-h-0 等 Flex 布局相关的 Tailwind Class 生效 */
</style>