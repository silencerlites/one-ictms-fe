<template>
  <section class="resend-card" :class="{ 'resend-card--ready': ready }" aria-label="Resend verification code">
    <div class="resend-card__header">
      <div class="resend-card__info">
        <q-icon :name="ready ? 'check_circle_outline' : 'schedule'" size="18px" />
        <span>{{ ready ? 'Ready for a new code' : 'Resend available soon' }}</span>
      </div>
      <span class="resend-card__time" aria-live="off">{{ ready ? 'Ready' : formatted }}</span>
    </div>
    <div class="resend-card__progress" role="progressbar" :aria-valuemin="0" :aria-valuemax="durationSeconds" :aria-valuenow="Math.max(0, durationSeconds - secondsLeft)" aria-label="Resend cooldown progress">
      <div class="resend-card__bar" :style="{ width: `${progressPercent}%` }" />
    </div>
    <q-btn
      type="button"
      unelevated
      no-caps
      class="resend-card__button full-width"
      :loading="loading"
      :disable="disabled || !ready"
      :label="ready ? buttonLabel : 'Please wait to resend'"
      :icon="ready ? 'refresh' : undefined"
      @click="emit('resend')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  secondsLeft: number
  formatted: string
  durationSeconds?: number
  buttonLabel?: string
  loading?: boolean
  disabled?: boolean
}>(), {
  durationSeconds: 60,
  buttonLabel: 'Resend code',
  loading: false,
  disabled: false,
})
const emit = defineEmits<{ resend: [] }>()
const ready = computed(() => props.secondsLeft <= 0)
const progressPercent = computed(() => Math.max(0, Math.min(100,
  ((props.durationSeconds - props.secondsLeft) / Math.max(1, props.durationSeconds)) * 100,
)))
</script>

<style scoped lang="scss">
.resend-card {
  width: 100%;
  padding: 15px;
  border-radius: 16px;
  border: 1px solid #e3e5f4;
  background: #fafaff;
  transition: background .2s ease, border-color .2s ease;
}
.resend-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.resend-card__info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
  color: #31358c;
  font-weight: 650;
  font-size: 13px;
}
.resend-card__time {
  flex: none;
  padding: 5px 10px;
  border-radius: 8px;
  background: #ededff;
  color: #303195;
  font-weight: 750;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.resend-card__progress {
  height: 4px;
  border-radius: 999px;
  background: #e3e5f2;
  overflow: hidden;
  margin: 12px 0;
}
.resend-card__bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2e3092, #6265cb 80%, #fcd116);
  transition: width .5s linear;
}
.resend-card__button {
  min-height: 42px;
  border-radius: 10px;
  background: #e9eafb !important;
  color: #34369b !important;
  font-size: 13px;
  font-weight: 700;
}
.resend-card__button:not(.disabled):hover { background: #dddff8 !important; }
.resend-card__button.disabled { opacity: .72 !important; }
.resend-card--ready { background: #f7fbf9; border-color: #cde9dd; }
.resend-card--ready .resend-card__info { color: #17805d; }
.resend-card--ready .resend-card__time { background: #dff3e9; color: #157453; }
.resend-card--ready .resend-card__bar { background: #21a779; }
.resend-card--ready .resend-card__button { background: #e1f4ea !important; color: #16684f !important; }
@media (prefers-reduced-motion: reduce) {
  .resend-card, .resend-card__bar { transition: none; }
}
</style>
