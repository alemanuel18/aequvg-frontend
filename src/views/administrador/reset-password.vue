<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminAuthApi } from '~/services/admin-auth'
definePageMeta({ layout: false })
useSeoMeta({ title: 'Establecer contraseña administrativa', robots: 'noindex, nofollow' })
const auth = useAdminAuthApi()
const token = ref('')
const tokenReady = ref(false)
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })
onMounted(() => { token.value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''; tokenReady.value = true })
const password = ref('')
const confirmation = ref('')
const errors = ref<Record<string, string>>({})
const requestError = ref('')
const successMessage = ref('')
const submitting = ref(false)
const validate = () => {
  const next: Record<string, string> = {}
  if (!token.value) next.token = 'Este enlace está incompleto. Solicita uno nuevo.'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/.test(password.value)) next.password = 'Usa 12–128 caracteres con mayúscula, minúscula, número y símbolo.'
  if (password.value !== confirmation.value) next.confirmation = 'Las contraseñas no coinciden.'
  errors.value = next
  if (Object.keys(next).length) nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  return !Object.keys(next).length
}
const submit = async () => {
  if (submitting.value || !validate()) return
  submitting.value = true; requestError.value = ''; successMessage.value = ''
  try { const result = await auth.resetPassword(token.value, password.value); successMessage.value = result.message; password.value = ''; confirmation.value = '' }
  catch (error) { requestError.value = error instanceof PublicApiError ? error.message : 'No se pudo cambiar la contraseña. Solicita un enlace nuevo.' }
  finally { submitting.value = false }
}
</script>
<template><main class="reset"><a class="skip" href="#reset-content">Saltar al formulario</a><section id="reset-content" class="card"><p class="eyebrow">Acceso administrativo</p><template v-if="successMessage"><h1>Contraseña actualizada</h1><p role="status" aria-live="polite">{{ successMessage }}</p><NuxtLink class="button" to="/administrador">Ir al inicio de sesión</NuxtLink></template><template v-else-if="!tokenReady"><h1>Establecer contraseña</h1><p>Comprobando el enlace…</p></template><template v-else><h1>Establecer contraseña</h1><p>El enlace es de un solo uso y vence en 30 minutos.</p><p v-if="!token || errors.token" class="error" role="alert">{{ errors.token || 'Este enlace está incompleto o ya venció.' }} <NuxtLink to="/administrador/recover-access">Solicitar otro enlace</NuxtLink></p><form v-else novalidate @submit.prevent="submit"><label for="new-password">Nueva contraseña</label><input id="new-password" v-model="password" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.password)" :aria-describedby="errors.password ? 'password-error' : undefined"><span v-if="errors.password" id="password-error" class="error">{{ errors.password }}</span><label for="confirm-password">Confirmar contraseña</label><input id="confirm-password" v-model="confirmation" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.confirmation)" :aria-describedby="errors.confirmation ? 'confirm-error' : undefined"><span v-if="errors.confirmation" id="confirm-error" class="error">{{ errors.confirmation }}</span><p v-if="requestError" class="error" role="alert">{{ requestError }} <NuxtLink to="/administrador/recover-access">Solicitar otro enlace</NuxtLink></p><button class="button" type="submit" :disabled="submitting">{{ submitting ? 'Actualizando…' : 'Guardar contraseña nueva' }}</button></form></template></section></main></template>
<style scoped>.reset{min-height:100vh;display:grid;place-items:center;padding:1rem;background:linear-gradient(145deg,#0b3d3a,#17645f 55%,#3d7570)}.card{width:min(38rem,100%);padding:clamp(1.25rem,5vw,2.5rem);background:white;border-radius:1rem;box-shadow:0 24px 60px #0003}.eyebrow{color:#17645f;font-size:.8rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}h1{margin:.5rem 0 1rem;font-size:clamp(2rem,8vw,3.4rem)}.card>p{line-height:1.65;color:#53615e}form{display:grid;gap:.55rem;margin-top:1.2rem}label{font-weight:800}input{min-height:2.9rem;padding:.65rem .75rem;border:1px solid #9caea9;border-radius:.55rem}[aria-invalid=true]{border:2px solid #a32121}.error{color:#a32121;font-weight:750;font-size:.88rem}.error a{color:#7b1717}.button{display:inline-flex;min-height:2.9rem;align-items:center;justify-content:center;padding:.65rem 1rem;color:white;background:#17645f;border:1px solid #17645f;border-radius:.55rem;text-decoration:none;font-weight:850;cursor:pointer}.button:disabled{opacity:.6;cursor:wait}.skip{position:fixed;top:.5rem;left:.5rem;padding:.7rem;background:white;border-radius:.5rem;transform:translateY(-180%)}.skip:focus{transform:none}:focus-visible{outline:3px solid #e6aa32;outline-offset:3px}</style>
