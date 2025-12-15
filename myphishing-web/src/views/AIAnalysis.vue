<!-- ==================== src/views/AIAnalysis.vue ==================== -->
<template>
  <div class="space-y-6">
    <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
      <div class="text-center">
        <Brain class="w-16 h-16 text-cyan-400 mx-auto mb-4" />
        <h2 class="text-2xl font-bold mb-2">AI 分析模块</h2>
        <p class="text-slate-400 mb-6">基于 DeepSeek 的钓鱼邮件智能分析</p>
        
        <div class="mt-8 text-left space-y-4">
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2 flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-yellow-400" />
              AI 钓鱼分析
            </h3>
            <p class="text-sm text-slate-400">POST /api/ai/aichat</p>
            <p class="text-xs text-slate-500 mt-2">综合分析邮件内容、相似邮件和威胁情报</p>
          </div>
          
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2">📊 分析维度</h3>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="text-sm">
                <span class="text-slate-400">• 邮件内容分析</span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">• 发件人信誉</span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">• URL/附件检测</span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">• 历史相似邮件</span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">• 威胁情报匹配</span>
              </div>
              <div class="text-sm">
                <span class="text-slate-400">• 钓鱼特征识别</span>
              </div>
            </div>
          </div>
          
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2">🎯 输出结果</h3>
            <div class="space-y-2 text-sm mt-3">
              <div class="flex items-center gap-2">
                <CheckCircle class="w-4 h-4 text-green-400" />
                <span class="text-slate-400">风险等级 (0=安全 / 1=可疑 / 2=恶意)</span>
              </div>
              <div class="flex items-center gap-2">
                <MessageSquare class="w-4 h-4 text-blue-400" />
                <span class="text-slate-400">详细分析理由</span>
              </div>
              <div class="flex items-center gap-2">
                <Tag class="w-4 h-4 text-purple-400" />
                <span class="text-slate-400">钓鱼类型分类</span>
              </div>
              <div class="flex items-center gap-2">
                <TrendingUp class="w-4 h-4 text-yellow-400" />
                <span class="text-slate-400">置信度评分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Brain, Sparkles, CheckCircle, MessageSquare, Tag, TrendingUp } from 'lucide-vue-next'
</script>
