<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h1 class="text-2xl font-bold">授权管理</h1>
      <p class="text-slate-400 mt-1">查看当前授权状态并激活授权码</p>
    </div>

    <!-- 全局提示（只提示，不挡界面） -->
    <div
      v-if="loadError"
      class="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 text-yellow-300 text-sm"
    >
      ⚠️ {{ loadError }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- ================= 左侧：授权状态 ================= -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield class="w-5 h-5 text-amber-400" />
          授权状态
        </h2>

        <div class="space-y-4">
          <!-- 状态 -->
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-400">当前状态：</span>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium border',
                licenseStatus.is_licensed
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              ]"
            >
              {{ licenseStatus.is_licensed ? '✅ 已授权' : '❌ 未授权' }}
            </span>
          </div>

          <!-- 已授权信息 -->
          <div
            v-if="licenseStatus.is_licensed"
            class="space-y-3 pt-4 border-t border-slate-700"
          >
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">生效时间</span>
              <span class="font-medium text-white">{{ licenseStatus.start_time || '-' }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">到期时间</span>
              <span class="font-medium text-white">{{ licenseStatus.end_time || '-' }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">剩余天数</span>
              <span :class="['font-medium', remainingColor]">{{ licenseStatus.remaining_days || 0 }} 天</span>
            </div>
            
            <div v-if="licenseStatus.activated_at" class="flex justify-between text-sm">
              <span class="text-slate-400">激活时间</span>
              <span class="font-medium text-white">{{ licenseStatus.activated_at }}</span>
            </div>

            <div
              v-if="licenseStatus.remaining_days && licenseStatus.remaining_days <= 7"
              class="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-300 text-sm"
            >
              ⚠️ 授权即将过期，请及时续期
            </div>
          </div>

          <!-- 未授权 -->
          <div v-else class="pt-4 border-t border-slate-700 text-slate-400 text-sm">
            {{ licenseStatus.message || '当前系统尚未授权' }}
          </div>
        </div>
      </div>

      <!-- ================= 右侧：激活 ================= -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <Key class="w-5 h-5 text-amber-400" />
          授权激活
        </h2>

        <div class="space-y-6">
          <!-- 机器码 -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">机器码</label>
            <div class="flex gap-2">
              <input
                :value="machineId || '加载中...'"
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
          </div>

          <!-- 授权码 -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">授权码</label>
            <textarea
              v-model="licenseCode"
              rows="4"
              placeholder="请粘贴授权码..."
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm resize-none"
            />
          </div>

          <!-- 激活 -->
          <button
            @click="activateLicense"
            :disabled="!licenseCode.trim() || activating"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="activating">激活中...</span>
            <span v-else>激活 / 重新授权</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Shield, Key, Copy } from 'lucide-vue-next'
import { licenseApi } from '@/api'

// ========= 状态 =========
const loading = ref(false)
const activating = ref(false)
const loadError = ref('')

const machineId = ref('')
const licenseCode = ref('')

const licenseStatus = ref({
  is_licensed: false,
  message: '未授权',
  start_time: '',
  end_time: '',
  remaining_days: 0,
  activated_at: '',
  status: ''
})

// ========= 计算属性 =========
const remainingColor = computed(() => {
  const d = licenseStatus.value.remaining_days || 0
  if (d > 30) return 'text-green-400'
  if (d > 7) return 'text-yellow-400'
  return 'text-red-400'
})

// ========= 方法 =========
const fetchMachineId = async () => {
  try {
    const data = await licenseApi.getMachineId()
    machineId.value = data.machine_id
    loadError.value = ''
  } catch (e) {
    console.error('获取机器码失败:', e)
    loadError.value = '获取机器码失败'
  }
}

const fetchLicenseStatus = async () => {
  try {
    loading.value = true
    const res = await licenseApi.getLicenseStatus()
    
    // 根据实际返回结构处理数据
    // 如果 res 是 { code: 200, data: {...} }，使用 res.data
    // 如果拦截器已经提取了 data，直接使用 res
    const statusData = res.data || res
    
    console.log('原始响应:', res)
    console.log('提取的数据:', statusData)
    
    // 确保 is_licensed 是布尔值
    licenseStatus.value = {
      message: '未授权',
      start_time: '',
      end_time: '',
      remaining_days: 0,
      activated_at: '',
      status: '',
      ...statusData,
      is_licensed: Boolean(statusData.is_licensed)
    }
    
    console.log('最终状态:', licenseStatus.value)
    loadError.value = ''
  } catch (err) {
    console.error('获取授权状态失败:', err)
    loadError.value = err?.message || '授权服务不可用'
    licenseStatus.value = {
      is_licensed: false,
      message: '未授权',
      start_time: '',
      end_time: '',
      remaining_days: 0,
      activated_at: '',
      status: ''
    }
  } finally {
    loading.value = false
  }
}

const activateLicense = async () => {
  try {
    activating.value = true
    await licenseApi.activateLicense({
      license_code: licenseCode.value.trim()
    })
    licenseCode.value = ''
    await fetchLicenseStatus()
    alert('授权激活成功')
  } catch (err) {
    console.error('激活失败:', err)
    alert(err?.message || '激活失败')
  } finally {
    activating.value = false
  }
}

const copyMachineId = async () => {
  if (!machineId.value) return
  try {
    await navigator.clipboard.writeText(machineId.value)
    alert('机器码已复制到剪贴板')
  } catch (e) {
    console.error('复制失败:', e)
    alert('复制失败，请手动复制')
  }
}

// ========= 生命周期 =========
onMounted(() => {
  fetchMachineId()
  fetchLicenseStatus()
})
</script>