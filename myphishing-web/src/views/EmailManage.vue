<!-- ==================== src/views/EmailManage.vue ==================== -->
<template>
  <div class="space-y-6">
    <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
      <div class="text-center">
        <Mail class="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h2 class="text-2xl font-bold mb-2">邮件管理模块</h2>
        <p class="text-slate-400 mb-6">查询、管理和分析所有邮件记录</p>
        
        <!-- TODO: 添加邮件管理功能 -->
        <div class="mt-8 text-left space-y-4">
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2">📧 邮件入库</h3>
            <p class="text-sm text-slate-400">POST /api/email/save_email</p>
          </div>
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2">🔍 邮件查询</h3>
            <p class="text-sm text-slate-400">POST /api/email/email_query</p>
          </div>
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2">⚠️ 风险更新</h3>
            <p class="text-sm text-slate-400">POST /api/email/update_email_risk</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Mail } from 'lucide-vue-next'
</script>