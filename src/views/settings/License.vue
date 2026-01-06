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
      <!-- 左侧：授权状态 -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield class="w-5 h-5 text-amber-400" />
          授权状态
        </h2>

        <div class="space-y-4">
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
                  licenseStatus.remaining_days > 30
                    ? 'text-green-400'
                    : licenseStatus.remaining_days > 7
                      ? 'text-yellow-400'
                      : 'text-red-400'
                ]"
              >
                {{ licenseStatus.remaining_days }} 天
              </span>
            </div>
          </div>

          <div v-else class="pt-4 border-t border-slate-700">
            <p class="text-slate-400 text-sm">{{ licenseStatus.message }}</p>
          </div>
        </div>
      </div>

      <!-- 右侧：激活 -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
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
                type="text"
                :value="machineId"
                readonly
                class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
              />
              <button
                @click="copyMachineId"
                class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 授权码 -->
          <textarea
            v-model="licenseCode"
            placeholder="请粘贴授权码..."
            rows="4"
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
          />

          <!-- 激活按钮 -->
          <button
            @click="activateLicense"
            :disabled="!licenseCode.trim() || activating"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg"
          >
            <span v-if="activating">激活中...</span>
            <span v-else>激活授权</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Shield, Key, Loader2, AlertCircle, Copy } from 'lucide-vue-next'
import { licenseApi } from '@/api'

const loading = ref(true)
const loadError = ref('')
const activating = ref(false)

const licenseStatus = ref({})
const machineId = ref('')
const licenseCode = ref('')
const copySuccess = ref(false)

// 获取授权状态
const fetchLicenseStatus = async () => {
  try {
    loading.value = true
    const res = await licenseApi.getLicenseStatus()
    licenseStatus.value = res.data.data
  } catch (err) {
    loadError.value = err.response?.data?.message || '授权服务不可用'
  } finally {
    loading.value = false
  }
}

// 获取机器码
const fetchMachineId = async () => {
  try {
    const res = await licenseApi.getMachineId()
    machineId.value = res.data.data.machine_id
  } catch (err) {
    console.error('获取机器码失败', err)
  }
}

// 激活授权
const activateLicense = async () => {
  try {
    activating.value = true
    await licenseApi.activateLicense({
      license_key: licenseCode.value.trim()
    })
    licenseCode.value = ''
    await fetchLicenseStatus()
    alert('授权激活成功')
  } catch (err) {
    alert(err.response?.data?.message || '激活失败')
  } finally {
    activating.value = false
  }
}

// 复制机器码
const copyMachineId = async () => {
  await navigator.clipboard.writeText(machineId.value)
}

onMounted(() => {
  fetchLicenseStatus()
  fetchMachineId()
})
</script>
