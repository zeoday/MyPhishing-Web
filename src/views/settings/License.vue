<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h1 class="text-2xl font-bold">授权管理</h1>
      <p class="text-slate-400 mt-1">查看当前授权状态并激活授权码</p>
    </div>

    <!-- 加载中（只影响状态数据，不挡页面） -->
    <div v-if="loading" class="flex items-center gap-3 text-slate-400">
      <Loader2 class="w-4 h-4 animate-spin" />
      正在加载授权信息...
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：授权状态 -->
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
                'px-3 py-1 rounded-full text-sm font-medium',
                licenseStatus.is_licensed
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              ]"
            >
              {{ licenseStatus.is_licensed ? '✅ 已授权' : '❌ 未授权' }}
            </span>
          </div>

          <!-- 已授权 -->
          <div
            v-if="licenseStatus.is_licensed"
            class="space-y-3 pt-4 border-t border-slate-700"
          >
            <div class="flex justify-between">
              <span class="text-slate-400">生效时间</span>
              <span>{{ licenseStatus.start_time }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">到期时间</span>
              <span>{{ licenseStatus.end_time }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">剩余天数</span>
              <span
                :class="licenseStatus.remaining_days > 30
                  ? 'text-green-400'
                  : licenseStatus.remaining_days > 7
                    ? 'text-yellow-400'
                    : 'text-red-400'"
              >
                {{ licenseStatus.remaining_days }} 天
              </span>
            </div>
          </div>

          <!-- 未授权 / 接口异常 -->
          <div v-else class="pt-4 border-t border-slate-700">
            <p class="text-slate-400 text-sm">
              {{ licenseStatus.message || '当前系统未授权或授权服务不可用' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：授权激活（永远显示） -->
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
                type="text"
                :value="machineId || '--'"
                readonly
                class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
              />
              <button
                @click="copyMachineId"
                class="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg"
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

          <!-- 激活 -->
          <button
            @click="activateLicense"
            :disabled="!licenseCode.trim() || activating"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
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
import { Shield, Key, Loader2, Copy } from 'lucide-vue-next'
import { licenseApi } from '@/api'

const loading = ref(false)
const activating = ref(false)

const licenseStatus = ref({
  is_licensed: false,
  message: '尚未授权'
})

const machineId = ref('')
const licenseCode = ref('')

const fetchLicenseStatus = async () => {
  try {
    loading.value = true
    const res = await licenseApi.getLicenseStatus()
    licenseStatus.value = res.data.data
  } catch (err) {
    licenseStatus.value = {
      is_licensed: false,
      message: err.response?.data?.message || '授权服务不可用'
    }
  } finally {
    loading.value = false
  }
}

const fetchMachineId = async () => {
  try {
    const res = await licenseApi.getMachineId()
    machineId.value = res.data.data.machine_id
  } catch {
    machineId.value = ''
  }
}

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

const copyMachineId = async () => {
  if (machineId.value) {
    await navigator.clipboard.writeText(machineId.value)
  }
}

onMounted(() => {
  fetchLicenseStatus()
  fetchMachineId()
})
</script>
