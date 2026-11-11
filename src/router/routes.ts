import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
      { path: 'system-registry', component: () => import('@/pages/SystemRegistryPage.vue'), meta: { title: 'System Registry' } },
      { path: 'scrum-planning', component: () => import('@/pages/ScrumPlanningPage.vue'), meta: { title: 'Scrum Planning' } },
      { path: 'my-tasks', component: () => import('@/pages/MyTasksPage.vue'), meta: { title: 'My Tasks' } },
      { path: 'account', component: () => import('@/pages/AccountPage.vue') },
      { path: 'change-password', component: () => import('@/pages/ChangePasswordPage.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { guest: true } },
      { path: 'login-otp', component: () => import('@/pages/LoginOtpPage.vue'), meta: { guest: true } },
      { path: 'register', component: () => import('@/pages/RegisterPage.vue'), meta: { guest: true } },
      { path: 'verify-email', component: () => import('@/pages/VerifyEmailPage.vue'), meta: { guest: true } },
      { path: 'forgot-password', component: () => import('@/pages/ForgotPasswordPage.vue'), meta: { guest: true } },
      { path: 'reset-password', component: () => import('@/pages/ResetPasswordPage.vue'), meta: { guest: true } }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('@/pages/NotFoundPage.vue') }
]
export default routes
