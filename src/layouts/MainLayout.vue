<template>
  <q-layout view="hHh Lpr lFf" class="workspace-layout">
    <q-header class="workspace-header">
      <q-toolbar class="workspace-toolbar">
        <q-btn flat round dense icon="menu" class="menu-trigger" aria-label="Toggle navigation" @click="drawer = !drawer" />
        <div class="workspace-toolbar__breadcrumb">Workspace <q-icon name="chevron_right" /> <span>{{ route.meta.title || 'Overview' }}</span></div>
        <q-space />
        <div class="workspace-toolbar__user gt-xs">{{ auth.user?.username }}</div>
        <q-btn flat round class="workspace-avatar" icon="person_outline" aria-label="Account menu">
          <q-menu class="workspace-menu" anchor="bottom right" self="top right">
            <q-list style="min-width: 195px">
              <q-item clickable v-close-popup to="/account"><q-item-section avatar><q-icon name="person_outline" /></q-item-section><q-item-section>My account</q-item-section></q-item>
              <q-item clickable v-close-popup to="/change-password"><q-item-section avatar><q-icon name="lock_outline" /></q-item-section><q-item-section>Change password</q-item-section></q-item>
              <q-separator spaced />
              <q-item clickable v-close-popup @click="signOut"><q-item-section avatar><q-icon name="logout" /></q-item-section><q-item-section>Sign out</q-item-section></q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" show-if-above bordered :width="268" class="workspace-drawer">
      <div class="drawer-brand"><div class="drawer-brand__icon"><q-icon name="grid_view" size="22px" /></div><div><strong>ONE ICTMS</strong><small>Digital workspace</small></div></div>
      <div class="drawer-nav-label">WORKSPACE</div>
      <q-list class="drawer-nav">
        <q-item clickable v-ripple to="/dashboard" exact><q-item-section avatar><q-icon name="space_dashboard" /></q-item-section><q-item-section>Overview</q-item-section></q-item>
        <q-item clickable v-ripple to="/system-registry"><q-item-section avatar><q-icon name="dns" /></q-item-section><q-item-section>System Registry</q-item-section></q-item>
        <q-item clickable v-ripple to="/account"><q-item-section avatar><q-icon name="person_outline" /></q-item-section><q-item-section>My account</q-item-section></q-item>
        <q-item clickable v-ripple to="/change-password"><q-item-section avatar><q-icon name="lock_outline" /></q-item-section><q-item-section>Security</q-item-section></q-item>
      </q-list>
      <div class="drawer-footer">DSWD · ONE ICTMS</div>
    </q-drawer>
    <q-page-container><router-view #default="{ Component, route }"><transition name="ictms-page" mode="out-in"><component :is="Component" :key="route.path" /></transition></router-view></q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
const drawer = ref(false)
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
async function signOut() {
  try { await auth.logout(); $q.notify({ type: 'positive', message: 'Logged out.' }) }
  catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { await router.replace('/login') }
}
</script>
