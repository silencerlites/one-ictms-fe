<template>
  <div class="otp-code" role="group" :aria-label="ariaLabel" @paste="handlePaste">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(element) => setInput(element as HTMLInputElement | null, index)"
      :value="digit"
      class="otp-code__box"
      :class="{ 'otp-code__box--filled': !!digit, 'otp-code__box--error': error }"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="1"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :aria-label="`Digit ${index + 1} of ${length}`"
      :disabled="disabled"
      @input="handleInput($event, index)"
      @keydown="handleKeydown($event, index)"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  length?: number
  disabled?: boolean
  error?: boolean
  ariaLabel?: string
}>(), { length: 6, disabled: false, error: false, ariaLabel: 'Verification code' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const inputs: (HTMLInputElement | null)[] = []
const digits = ref<string[]>(Array(props.length).fill(''))

watch(() => props.modelValue, value => {
  const cleaned = (value || '').replace(/\D/g, '').slice(0, props.length)
  const fresh = Array.from({ length: props.length }, (_, i) => cleaned[i] || '')
  if (fresh.some((char, i) => char !== digits.value[i])) digits.value = fresh
}, { immediate: true })

function setInput(element: HTMLInputElement | null, index: number) { inputs[index] = element }
function focusIndex(index: number) {
  void nextTick(() => inputs[Math.max(0, Math.min(index, props.length - 1))]?.focus())
}
function publish() { emit('update:modelValue', digits.value.join('')) }
function put(value: string, start: number) {
  const chars = value.replace(/\D/g, '').slice(0, props.length - start).split('')
  if (!chars.length) return
  chars.forEach((char, offset) => { digits.value[start + offset] = char })
  publish()
  focusIndex(Math.min(start + chars.length, props.length - 1))
}
function handleInput(event: Event, index: number) {
  const el = event.target as HTMLInputElement
  const entered = el.value.replace(/\D/g, '')
  if (entered.length > 1) { put(entered, index); return }
  digits.value[index] = entered.slice(-1)
  el.value = digits.value[index] || ''
  publish()
  if (digits.value[index] && index < props.length - 1) focusIndex(index + 1)
}
function handleKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    if (digits.value[index]) digits.value[index] = ''
    else if (index > 0) { digits.value[index - 1] = ''; focusIndex(index - 1) }
    publish()
  } else if (event.key === 'ArrowLeft') { event.preventDefault(); focusIndex(index - 1) }
  else if (event.key === 'ArrowRight') { event.preventDefault(); focusIndex(index + 1) }
  else if (event.key.length === 1 && !/\d/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) event.preventDefault()
}
function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  put(event.clipboardData?.getData('text') || '', 0)
}
</script>

<style scoped lang="scss">
.otp-code { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: clamp(6px, 1vw, 12px); width: 100%; }
.otp-code__box { width: 100%; min-width: 0; height: 64px; text-align: center; border-radius: 15px; border: 1px solid #cbd3ea; outline: none; color: #272870; background: #fbfbff; font-size: clamp(1.2rem, 2.2vw, 1.8rem); font-weight: 700; transition: border-color .2s, box-shadow .2s, transform .2s, background .2s; }
.otp-code__box:hover { border-color: #8787da; }
.otp-code__box:focus-visible { border-color: #2e3092; background: #fff; box-shadow: 0 0 0 3px rgba(46, 48, 146, .12); transform: translateY(-2px); }
.otp-code__box--filled { border-color: #7779d4; background: #f5f5ff; }
.otp-code__box--error { border-color: #ee1a24; }
.otp-code__box:disabled { opacity: .6; }
@media (max-width: 480px) { .otp-code__box { height: 52px; border-radius: 11px; } }
@media (prefers-reduced-motion: reduce) { .otp-code__box { transition: none; } }
</style>
