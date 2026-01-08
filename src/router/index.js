import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'emails',
        name: 'EmailManage',
        component: () => import('@/views/EmailManage.vue')
      },
      {
        path: 'threats',
        name: 'ThreatDetection',
        component: () => import('@/views/ThreatDetection.vue')
      },
      {
        path: 'vector',
        name: 'VectorSearch',
        component: () => import('@/views/VectorSearch.vue')
      },
      {
        path: 'ai',
        name: 'AIAnalysis',
        component: () => import('@/views/AIAnalysis.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue')
      },
      // 系统设置 - 改为重定向到第一个子页面
      {
        path: 'settings',
        redirect: '/settings/alert'
      },
      // 系统设置 - 告警拦截配置
      {
        path: 'settings/alert',
        name: 'SettingsAlert',
        component: () => import('@/views/settings/Alert.vue')
      },
      // 系统设置 - 授权管理
      {
        path: 'settings/license',
        name: 'SettingsLicense',
        component: () => import('@/views/settings/License.vue')
      },
      // 系统设置 - 日志分析
      {
        path: 'settings/logs',
        name: 'SettingsLogs',
        component: () => import('@/views/settings/Logs.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router