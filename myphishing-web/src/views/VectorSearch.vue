<!-- ==================== src/views/VectorSearch.vue ==================== -->
<template>
  <div class="space-y-6">
    <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
      <div class="text-center">
        <Database class="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 class="text-2xl font-bold mb-2">向量检索模块</h2>
        <p class="text-slate-400 mb-6">基于 Chroma 向量库的相似邮件检索</p>
        
        <div class="mt-8 text-left space-y-4">
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2 flex items-center gap-2">
              <Zap class="w-5 h-5 text-yellow-400" />
              邮件向量化
            </h3>
            <p class="text-sm text-slate-400">POST /api/ai/email_to_vector</p>
            <p class="text-xs text-slate-500 mt-2">将邮件文本转换为向量表示</p>
          </div>
          
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2 flex items-center gap-2">
              <Save class="w-5 h-5 text-blue-400" />
              写入向量库
            </h3>
            <p class="text-sm text-slate-400">POST /api/ai/save_email_to_chroma_by_id</p>
            <p class="text-xs text-slate-500 mt-2">保存邮件向量到 Chroma</p>
          </div>
          
          <div class="p-4 bg-slate-800/30 rounded-xl">
            <h3 class="font-semibold mb-2 flex items-center gap-2">
              <Search class="w-5 h-5 text-purple-400" />
              相似邮件检索
            </h3>
            <p class="text-sm text-slate-400">POST /api/ai/search_chroma</p>
            <p class="text-xs text-slate-500 mt-2">基于向量相似度查找历史邮件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Database, Zap, Save, Search } from 'lucide-vue-next'
</script>