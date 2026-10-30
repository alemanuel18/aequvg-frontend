<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminAuthApi } from '~/services/admin-auth'
definePageMeta({ layout: false, alias: ['/administrador/recuperar-acceso'] })
useSeoMeta({ title: 'Recuperar acceso administrativo', robots: 'noindex, nofollow' })
const auth = useAdminAuthApi()
const email = ref('')
const emailError = ref('')
const requestError = ref('')
const sent = ref(false)
const submitting = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const submit = async () => {
  if (submitting.value) return
  emailError.value = ''; requestError.value = ''
  const normalized = email.value.trim().toLowerCase()
  if (!/^[^\s@]+@uvg\.edu\.gt$/i.test(normalized)) {
    emailError.value = 'Escribe un correo institucional @uvg.edu.gt.'
    await nextTick(); emailInput.value?.focus(); return
  }
  submitting.value = true
  try { await auth.requestPasswordRecovery(normalized); sent.value = true }
  catch (error) { requestError.value = error instanceof PublicApiError ? error.message : 'No se pudo procesar la solicitud. Intenta nuevamente.' }
  finally { submitting.value = false }
}
</script>
<template><main class="recovery"><a class="skip" href="#recovery-content">Saltar al contenido</a><section id="recovery-content" class="card"><p class="eyebrow">Ayuda con tu cuenta</p><template v-if="sent"><h1>Revisa tu correo</h1><p role="status" aria-live="polite">Si existe una cuenta administrativa con ese correo, enviaremos un enlace para cambiar la contraseña. El enlace vence en 30 minutos.</p><NuxtLink class="button" to="/administrador">Volver al inicio de sesión</NuxtLink></template><template v-else><h1>Recuperar acceso</h1><p>Te enviaremos un enlace de un solo uso al correo institucional asociado a tu cuenta.</p><form novalidate @submit.prevent="submit"><label for="recovery-email">Correo institucional</label><input id="recovery-email" ref="emailInput" v-model="email" type="email" inputmode="email" autocomplete="email" :aria-invalid="Boolean(emailError)" :aria-describedby="emailError ? 'email-error' : undefined"><span v-if="emailError" id="email-error" class="error">{{ emailError }}</span><p v-if="requestError" class="error" role="alert">{{ requestError }}</p><button class="button" type="submit" :disabled="submitting">{{ submitting ? 'Enviando…' : 'Enviar enlace de recuperación' }}</button></form></template><div class="actions"><NuxtLink to="/administrador">Volver al inicio de sesión</NuxtLink><NuxtLink to="/contacto">Contactar a AsoQuímica</NuxtLink></div></section></main></template>
<style scoped>.recovery{min-height:100vh;display:grid;place-items:center;padding:1rem;background:linear-gradient(145deg,#0b3d3a,#17645f 55%,#3d7570)}.card{width:min(38rem,100%);padding:clamp(1.25rem,5vw,2.5rem);background:white;border-radius:1rem;box-shadow:0 24px 60px #0003}.eyebrow{color:#17645f;font-size:.8rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}h1{margin:.5rem 0 1rem;font-size:clamp(2rem,8vw,3.4rem)}.card p{line-height:1.65}.card>p:not(.eyebrow){color:#53615e}form{display:grid;gap:.55rem;margin-top:1.2rem}label{font-weight:800}input{min-height:2.9rem;padding:.65rem .75rem;border:1px solid #9caea9;border-radius:.55rem}[aria-invalid=true]{border:2px solid #a32121}.error{color:#a32121;font-weight:750;font-size:.88rem}.button{display:inline-flex;min-height:2.9rem;align-items:center;justify-content:center;padding:.65rem 1rem;color:white;background:#17645f;border:1px solid #17645f;border-radius:.55rem;text-decoration:none;font-weight:850;cursor:pointer}.button:disabled{opacity:.6;cursor:wait}.actions{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.5rem}.actions a{color:#0b514c;font-weight:800;text-underline-offset:.2em}.skip{position:fixed;top:.5rem;left:.5rem;padding:.7rem;background:white;border-radius:.5rem;transform:translateY(-180%)}.skip:focus{transform:none}:focus-visible{outline:3px solid #e6aa32;outline-offset:3px}</style>
