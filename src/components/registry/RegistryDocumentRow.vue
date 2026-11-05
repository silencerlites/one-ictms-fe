<template>
  <div class="registry-document-row">
    <div class="registry-document-row__top">
      <div class="registry-document-row__name">
        <q-icon name="description" size="21px" color="indigo-8" />
        <span>{{ documentName }}</span>
        <q-icon v-if="hasFile" name="check_circle" color="positive" size="19px">
          <q-tooltip>A stored file path or locally selected file exists</q-tooltip>
        </q-icon>
      </div>
      <div class="registry-document-row__actions">
        <!-- Step 1: responsibility must be assigned before preparing the document. -->
        <q-btn
          v-if="!assigneeName" no-caps outline color="indigo-8"
          icon="person_add_alt_1" label="Assign User"
          :aria-label="`Assign user to ${documentName}`"
          @click="emit('assign', String(index))"
        />
        <template v-else-if="!hasDocument">
          <!-- Step 2: assignee exists, but no file or draft has been prepared. -->
          <q-btn no-caps outline color="indigo-8" icon="upload_file" label="Upload"
            @click="emit('upload', index)" />
          <q-btn no-caps outline color="indigo-8" icon="auto_awesome" label="Draft using AI"
            @click="emit('draft', index)">
            <q-tooltip>Creates a local draft template. AI generation requires a backend integration.</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="person_remove"
            :aria-label="`Remove assigned user from ${documentName}`"
            @click="emit('remove-assignee', String(index))">
            <q-tooltip>Remove assignment</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <!-- Step 3: uploaded/selected file OR prepared draft. -->
          <q-btn flat round color="indigo-8" icon="drive_folder_upload"
            :aria-label="`Replace ${documentName}`" @click="emit('upload', index)">
            <q-tooltip>Replace with a file</q-tooltip>
          </q-btn>
          <q-btn flat round color="indigo-8" icon="visibility"
            :aria-label="`View ${documentName}`" @click="emit('view', index)">
            <q-tooltip>View document or draft</q-tooltip>
          </q-btn>
          <q-btn flat round color="indigo-8" icon="edit"
            :aria-label="`Edit ${documentName}`" @click="emit('edit', index)">
            <q-tooltip>Edit document or draft</q-tooltip>
          </q-btn>
        </template>
        <input :id="`registry-file-${index}`" class="registry-document-row__file" type="file" @change="emit('file-selected', String(index), $event)" />
      </div>
    </div>
    <div v-if="doc.file_path?.trim()" class="registry-document-row__stored-path">
      <q-icon :name="isPendingPath ? 'schedule' : 'attach_file'" size="16px" />
      <span class="registry-document-row__path-text">{{ isPendingPath ? 'Pending document (not uploaded)' : doc.file_path }}</span>
    </div>
    <div v-if="draftName || selectedFileName || assigneeName" class="registry-document-row__meta">
      <span v-if="draftName"><q-icon name="edit_note" /> {{ draftName }}</span>
      <span v-if="selectedFileName"><q-icon name="attach_file" /> {{ selectedFileName }} (selected locally)</span>
      <span v-if="assigneeName"><q-icon name="person" /> {{ assigneeName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RegistryPayload } from '@/types/registry'

type RegistryDoc = NonNullable<RegistryPayload['docs']>[number]
const props = defineProps<{
  doc: RegistryDoc
  index: number
  documentName: string
  selectedFileName: string
  draftName: string
  assigneeName: string
}>()
const isPendingPath = computed(() => /^__pending_(document|draft|upload)__\//.test(props.doc.file_path ?? ''))
const hasFile = computed(() => Boolean((props.doc.file_path?.trim() && !isPendingPath.value) || props.selectedFileName))
const hasDocument = computed(() => hasFile.value || Boolean(props.draftName))
const emit = defineEmits<{
  upload: [index: number]
  draft: [index: number]
  assign: [index: string]
  'remove-assignee': [index: string]
  view: [index: number]
  edit: [index: number]
  'file-selected': [index: string, event: Event]
}>()
</script>

<style scoped>
.registry-document-row{border:1px solid #e1e5f1;border-radius:12px;padding:16px;background:#fff;display:flex;flex-direction:column;gap:10px}
.registry-document-row__top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.registry-document-row__name{display:flex;gap:9px;align-items:center;color:#27367e;font-weight:700;font-size:14px;min-width:0}
.registry-document-row__stored-path{display:flex;align-items:center;gap:6px;color:#59647d;font-size:12px;min-width:0}
.registry-document-row__path-text{overflow-wrap:anywhere}
.registry-document-row__actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-left:auto}
@media(max-width:640px){.registry-document-row__actions{margin-left:0;width:100%}}
.registry-document-row__file{display:none}
.registry-document-row__meta{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#535f87}
.registry-document-row__meta span{display:inline-flex;align-items:center;gap:5px}
</style>
