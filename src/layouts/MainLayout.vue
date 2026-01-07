<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
    
    <!-- 顶部导航栏 -->
    <nav class="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-50">
      <div class="h-full px-3 md:px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button 
            @click="sidebarOpen = !sidebarOpen"
            class="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu v-if="!sidebarOpen" :size="20" />
            <X v-else :size="20" />
          </button>
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield class="w-6 h-6" />
            </div>
            <div class="hidden sm:block">
              <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                邮件安全检测平台
              </h1>
              <p class="text-xs text-slate-400">Email Security Detection Platform</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3 md:gap-4">
          <div class="relative hidden sm:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="搜索邮件 ID..."
              @keyup.enter="handleSearch"
              class="w-48 md:w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-slate-400"
            />
          </div>
          
          <button class="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Bell :size="20" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button class="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <User :size="20" />
          </button>
        </div>
      </div>
    </nav>

    <!-- 侧边栏 -->
    <aside 
      :class="[
        'fixed left-0 top-16 bottom-0 backdrop-blur-xl border-r border-slate-800 transition-transform duration-300 z-40 overflow-y-auto',
        'md:w-64 w-full',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="p-4 space-y-2">
        <!-- 一级菜单 -->
        <template v-for="item in navigationItems" :key="item.id">
          <!-- 没有子菜单的普通菜单项 -->
          <router-link
            v-if="!item.children"
            :to="item.path"
            custom
            v-slot="{ isActive, navigate }"
          >
            <button
              @click="navigate"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                isActive 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                  : 'hover:bg-slate-800/50 border border-transparent'
              ]"
            >
              <component :is="item.icon" :class="['w-5 h-5', item.color]" />
              <span class="font-medium">{{ item.label }}</span>
            </button>
          </router-link>

          <!-- 有子菜单的菜单项 -->
          <div v-else>
            <!-- 父级菜单按钮 -->
            <button
              @click="toggleSubmenu(item.id)"
              :class="[
                'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all',
                isSubmenuActive(item) 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                  : 'hover:bg-slate-800/50 border border-transparent'
              ]"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" :class="['w-5 h-5', item.color]" />
                <span class="font-medium">{{ item.label }}</span>
              </div>
              <ChevronDown 
                :class="[
                  'w-4 h-4 transition-transform',
                  openSubmenus.includes(item.id) ? 'rotate-180' : ''
                ]"
              />
            </button>

            <!-- 子菜单 -->
            <transition name="submenu">
              <div v-if="openSubmenus.includes(item.id)" class="mt-1 ml-4 space-y-1">
                <router-link
                  v-for="child in item.children"
                  :key="child.id"
                  :to="child.path"
                  custom
                  v-slot="{ isActive, navigate }"
                >
                  <button
                    @click="navigate"
                    :class="[
                      'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm',
                      isActive 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                    ]"
                  >
                    <component :is="child.icon" class="w-4 h-4" />
                    <span>{{ child.label }}</span>
                  </button>
                </router-link>
              </div>
            </transition>
          </div>
        </template>
      </div>
    </aside>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- 主内容区域 -->
    <main :class="[
      'pt-16 transition-all duration-300',
      sidebarOpen ? 'md:pl-64 pl-0' : 'pl-0'
    ]">
      <div class="p-4 md:p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, Shield, Search, Bell, User, BarChart3, Mail, Database, Brain, FileText, Settings, AlertCircle, Key, ChevronDown } from 'lucide-vue-next'

const route = useRoute()
const sidebarOpen = ref(false)
const searchQuery = ref('')
const openSubmenus = ref([]) // 展开的子菜单ID列表

const navigationItems = [
  { id: 'dashboard', path: '/dashboard', icon: BarChart3, label: '数据面板', color: 'text-blue-400' },
  { id: 'emails', path: '/emails', icon: Mail, label: '邮件管理', color: 'text-purple-400' },
  { id: 'threats', path: '/threats', icon: Shield, label: '威胁检测', color: 'text-red-400' },
  { id: 'vector', path: '/vector', icon: Database, label: '向量检索', color: 'text-green-400' },
  { id: 'ai', path: '/ai', icon: Brain, label: 'AI分析', color: 'text-cyan-400' },
  { id: 'reports', path: '/reports', icon: FileText, label: '报告中心', color: 'text-indigo-400' },
  // 系统设置 - 带子菜单
  { 
    id: 'settings', 
    icon: Settings, 
    label: '系统设置', 
    color: 'text-amber-400',
    children: [
      { id: 'alert', path: '/settings/alert', icon: AlertCircle, label: '告警拦截配置' },
      { id: 'license', path: '/settings/license', icon: Key, label: '授权管理' }
    ]
  }
]

// 切换子菜单展开/收起
const toggleSubmenu = (menuId) => {
  const index = openSubmenus.value.indexOf(menuId)
  if (index > -1) {
    openSubmenus.value.splice(index, 1)
  } else {
    openSubmenus.value.push(menuId)
  }
}

// 判断父级菜单是否激活（任意子菜单激活则父级也高亮）
const isSubmenuActive = (item) => {
  if (!item.children) return false
  return item.children.some(child => route.path === child.path)
}

// 监听路由变化，自动展开对应的父级菜单
watch(() => route.path, (newPath) => {
  navigationItems.forEach(item => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => newPath === child.path)
      if (hasActiveChild && !openSubmenus.value.includes(item.id)) {
        openSubmenus.value.push(item.id)
      }
    }
  })
}, { immediate: true })

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('搜索邮件:', searchQuery.value)
  }
}

const handleResize = () => {
  const isDesktop = window.innerWidth >= 768
  sidebarOpen.value = isDesktop
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 子菜单展开/收起动画 */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

/* 滚动条样式 */
aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>