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
            <InfoRow label="生效时间" :value="licenseStatus.start_time" />
            <InfoRow label="到期时间" :value="licenseStatus.end_time" />
            <InfoRow
              label="剩余天数"
              :value="licenseStatus.remaining_days + ' 天'"
              :valueClass="remainingColor"
            />
            <InfoRow
              v-if="licenseStatus.activated_at"
              label="激活时间"
              :value="licenseStatus.activated_at"
            />

            <div
              v-if="licenseStatus.remaining_days <= 7"
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
                class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg"
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
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
            />
          </div>

          <!-- 激活 -->
          <button
            @click="activateLicense"
            :disabled="!licenseCode.trim() || activating"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-60"
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

/* ========= state ========= */
const loading = ref(false)
const activating = ref(false)
const loadError = ref('')

const machineId = ref('')
const licenseCode = ref('')

const licenseStatus = ref({
  is_licensed: false,
  message: '未授权'
})

/* ========= computed ========= */
const remainingColor = computed(() => {
  const d = licenseStatus.value.remaining_days || 0
  if (d > 30) return 'text-green-400'
  if (d > 7) return 'text-yellow-400'
  return 'text-red-400'
})

/* ========= methods ========= */
const fetchMachineId = async () => {
  try {
    const res = await licenseApi.getMachineId()
    // 🔴 关键修复：先打印响应，确认实际结构（开发环境调试用，调试完可删除）
    console.log('机器码接口响应：', res)
    
    // 情况1：如果 request 工具已解析 res.data，直接取 res.data.machine_id
    machineId.value = res.data.machine_id 
    // 情况2：如果 request 工具未解析，保留原逻辑（二选一，根据实际打印结果调整）
    // machineId.value = res.data.data.machine_id
    
    loadError.value = '' // 成功获取后清空错误提示
  } catch (err) {
    // 🔴 优化：打印错误信息，便于排查
    console.error('获取机器码失败详情：', err)
    machineId.value = ''
    loadError.value = '获取机器码失败：' + (err?.message || '未知错误')
  }
}

const fetchLicenseStatus = async () => {
  try {
    loading.value = true
    const res = await licenseApi.getLicenseStatus()
    licenseStatus.value = {
      is_licensed: false,
      ...res.data
    }
  } catch (err) {
    loadError.value = err?.message || '授权服务不可用'
    licenseStatus.value = {
      is_licensed: false,
      message: '未授权'
    }
  } finally {
    loading.value = false
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
    alert(err?.message || '激活失败')
  } finally {
    activating.value = false
  }
}

const copyMachineId = async () => {
  if (!machineId.value) return
  await navigator.clipboard.writeText(machineId.value)
}

/* ========= init ========= */
onMounted(() => {
  fetchMachineId()
  fetchLicenseStatus()
})
</script>

<!-- 行组件 -->
<script>
export default {
  components: {
    InfoRow: {
      props: ['label', 'value', 'valueClass'],
      template: `
        <div class="flex justify-between text-sm">
          <span class="text-slate-400">{{ label }}</span>
          <span :class="['font-medium', valueClass]">{{ value }}</span>
        </div>
      `
    }
  }
}
</script>
