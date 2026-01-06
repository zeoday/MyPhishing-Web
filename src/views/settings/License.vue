<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold">授权管理</h1>
      <p class="text-slate-400 mt-1">查看当前授权状态并激活授权码</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-10">
      <Loader2 class="w-8 h-8 animate-spin text-amber-400" />
      <span class="ml-3 text-slate-300">加载授权信息中...</span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="bg-red-900/20 border border-red-800/50 rounded-2xl p-6">
      <div class="flex items-center gap-2 text-red-400">
        <AlertCircle class="w-5 h-5" />
        <span class="font-medium">授权信息加载失败</span>
      </div>
      <p class="mt-2 text-sm text-slate-400">{{ loadError }}</p>
      <button 
        @click="fetchLicenseStatus" 
        class="mt-3 text-amber-400 text-sm hover:underline"
      >
        重试加载
      </button>
    </div>

    <!-- 授权状态卡片 -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- 左侧：授权状态信息 -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield class="w-5 h-5 text-amber-400" />
          授权状态
        </h2>

        <!-- 授权状态展示 -->
        <div class="space-y-4">
          <!-- 状态标签 -->
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-400">当前状态：</span>
            <span 
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                licenseStatus.is_licensed 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              ]"
            >
              {{ licenseStatus.is_licensed ? '✅ 已授权' : '❌ 未授权' }}
            </span>
          </div>

          <!-- 授权详情 -->
          <div v-if="licenseStatus.is_licensed" class="space-y-3 pt-4 border-t border-slate-700">
            <div class="flex justify-between">
              <span class="text-slate-400">生效时间：</span>
              <span class="font-medium">{{ licenseStatus.start_time }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">到期时间：</span>
              <span class="font-medium">{{ licenseStatus.end_time }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">剩余天数：</span>
              <span 
                :class="[
                  'font-medium',
                  licenseStatus.remaining_days > 30 ? 'text-green-400' :
                  licenseStatus.remaining_days > 7 ? 'text-yellow-400' : 'text-red-400'
                ]"
              >
                {{ licenseStatus.remaining_days }} 天
              </span>
            </div>
            <div v-if="licenseStatus.activated_at" class="flex justify-between">
              <span class="text-slate-400">激活时间：</span>
              <span class="text-sm">{{ licenseStatus.activated_at }}</span>
            </div>
          </div>

          <!-- 未授权提示 -->
          <div v-else class="pt-4 border-t border-slate-700">
            <p class="text-slate-400 text-sm">{{ licenseStatus.message }}</p>
          </div>
        </div>

        <!-- 过期警告 -->
        <div 
          v-if="licenseStatus.is_licensed && licenseStatus.remaining_days <= 7"
          class="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <AlertCircle class="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p class="text-yellow-400 font-medium">授权即将过期</p>
              <p class="text-sm text-slate-400 mt-1">请及时联系管理员续期授权</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：机器码和授权激活 -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <Key class="w-5 h-5 text-amber-400" />
          授权激活
        </h2>

        <div class="space-y-6">
          <!-- 机器码 -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">
              机器码（请提供给管理员）
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                :value="licenseStatus.machine_id"
                readonly
                class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
              />
              <button
                @click="copyMachineId"
                class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              {{ copySuccess ? '✅ 已复制到剪贴板' : 'ℹ️ 点击右侧按钮复制机器码' }}
            </p>
          </div>

          <!-- 授权码输入 -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">
              授权码（从管理员处获取）
            </label>
            <textarea
              v-model="licenseCode"
              placeholder="请粘贴授权码..."
              :disabled="activating"
              rows="4"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-mono text-sm resize-none"
            ></textarea>
          </div>

          <!-- 激活按钮 -->
          <button
            @click="activateLicense"
            :disabled="!licenseCode.trim() || activating"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span v-if="activating" class="flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" />
              激活中...
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <Key class="w-4 h-4" />
              激活授权
            </span>
          </button>

          <!-- 激活说明 -->
          <div class="text-xs text-slate-500 space-y-1 pt-4 border-t border-slate-700">
            <p>💡 激活步骤：</p>
            <ol class="list-decimal list-inside space-y-1 ml-2">
              <li>复制上方的机器码</li>
              <li>将机器码发送给系统管理员</li>
              <li>管理员生成授权码后发送给你</li>
              <li>粘贴授权码到输入框并点击激活</li>
            </ol>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Shield, Key, Loader2, AlertCircle, Copy } from 'lucide-vue-next'
import axios from 'axios'

const loading = ref(true)
const loadError = ref('')
const activating = ref(false)
const licenseStatus = ref({})
const licenseCode = ref('')
const copySuccess = ref(false)

// 获取授权状态
const fetchLicenseStatus = async () => {
  try {
    loading.value = true
    loadError.value = ''
    
    const response = await axios.get('/api/license/status')
    licenseStatus.value = response.data.data
    
  } catch (error) {
    console.error('获取授权状态失败:', error)
    loadError.value = error.response?.data?.message || '无法连接到授权服务'
  } finally {
    loading.value = false
  }
}

// 复制机器码
const copyMachineId = async () => {
  try {
    await navigator.clipboard.writeText(licenseStatus.value.machine_id)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    alert('复制失败，请手动复制')
  }
}

// 激活授权
const activateLicense = async () => {
  if (!licenseCode.value.trim()) {
    alert('请输入授权码')
    return
  }

  try {
    activating.value = true
    
    const response = await axios.post('/api/license/activate', {
      license_code: licenseCode.value.trim()
    })
    
    alert('✅ 授权激活成功！')
    licenseCode.value = ''
    
    // 刷新授权状态
    await fetchLicenseStatus()
    
  } catch (error) {
    console.error('激活授权失败:', error)
    alert(`❌ 激活失败：${error.response?.data?.message || '未知错误'}`)
  } finally {
    activating.value = false
  }
}

onMounted(() => {
  fetchLicenseStatus()
})
</script>

<style scoped>
/* 自定义样式 */
</style>