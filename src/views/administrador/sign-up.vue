<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminAuthApi } from '~/services/admin-auth'
definePageMeta({ layout: false, alias: ['/administrador/crear-cuenta'] })
useSeoMeta({ title: 'Solicitar cuenta administrativa', robots: 'noindex, nofollow' })
const auth = useAdminAuthApi()
const fields = reactive({ firstNames: '', lastNames: '', email: '', password: '', confirmation: '' })
const errors = ref<Record<string, string>>({})
const requestError = ref('')
const sent = ref(false)
const submitting = ref(false)
const validate = () => {
  const next: Record<string, string> = {}
  if (fields.firstNames.trim().length < 2) next.firstNames = 'Escribe tus nombres.'
  if (fields.lastNames.trim().length < 2) next.lastNames = 'Escribe tus apellidos.'
  if (!/^[^\s@]+@uvg\.edu\.gt$/i.test(fields.email.trim())) next.email = 'Usa un correo institucional @uvg.edu.gt.'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/.test(fields.password)) next.password = 'Usa 12–128 caracteres con mayúscula, minúscula, número y símbolo.'
  if (fields.confirmation !== fields.password) next.confirmation = 'Las contraseñas no coinciden.'
  errors.value = next
  if (Object.keys(next).length) nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  return !Object.keys(next).length
}
const submit = async () => {
  if (submitting.value || !validate()) return
  submitting.value = true; requestError.value = ''
  try { await auth.requestRegistration({ firstNames: fields.firstNames.trim(), lastNames: fields.lastNames.trim(), email: fields.email.trim().toLowerCase(), password: fields.password }); sent.value = true }
  catch (error) { requestError.value = error instanceof PublicApiError ? error.message : 'No se pudo enviar la solicitud. Intenta nuevamente.' }
  finally { submitting.value = false }
}
</script>
<template><main class="signup"><a class="skip" href="#signup-form">Saltar al formulario</a><header><NuxtLink to="/">AsoQuímica UVG</NuxtLink><span>Solicitud de acceso administrativo</span></header><section class="card"><template v-if="sent"><p class="eyebrow">Solicitud enviada</p><h1>Tu solicitud está pendiente</h1><p>Una persona administradora revisará la solicitud. Si se aprueba, tu cuenta recibirá el rol asignado por quien la revisó.</p><NuxtLink class="button" to="/administrador">Volver al inicio de sesión</NuxtLink></template><template v-else><p class="eyebrow">Crear cuenta</p><h1>Solicita acceso administrativo</h1><p class="intro">La cuenta no se activa hasta que una persona administradora apruebe la solicitud y asigne un rol.</p><form id="signup-form" novalidate @submit.prevent="submit"><label>Nombres<input v-model="fields.firstNames" autocomplete="given-name" maxlength="80" :aria-invalid="!!errors.firstNames"><span v-if="errors.firstNames" class="error">{{ errors.firstNames }}</span></label><label>Apellidos<input v-model="fields.lastNames" autocomplete="family-name" maxlength="80" :aria-invalid="!!errors.lastNames"><span v-if="errors.lastNames" class="error">{{ errors.lastNames }}</span></label><label>Correo institucional<input v-model="fields.email" type="email" inputmode="email" autocomplete="email" :aria-invalid="!!errors.email"><span v-if="errors.email" class="error">{{ errors.email }}</span></label><label>Contraseña<input v-model="fields.password" type="password" autocomplete="new-password" :aria-invalid="!!errors.password"><span v-if="errors.password" class="error">{{ errors.password }}</span></label><label>Confirmar contraseña<input v-model="fields.confirmation" type="password" autocomplete="new-password" :aria-invalid="!!errors.confirmation"><span v-if="errors.confirmation" class="error">{{ errors.confirmation }}</span></label><p v-if="requestError" class="error" role="alert">{{ requestError }}</p><button class="button" type="submit" :disabled="submitting">{{ submitting ? 'Enviando solicitud…' : 'Enviar solicitud' }}</button></form><NuxtLink class="back" to="/administrador">Ya tengo una cuenta</NuxtLink></template></section></main></template>
<style scoped>.signup{min-height:100vh;padding:0 1rem 3rem;background:linear-gradient(145deg,#0b3d3a,#17645f 50%,#3d7570)}header{width:min(72rem,100%);min-height:5rem;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;color:white}header a{color:white;font-weight:900;text-decoration:none}header span{font-size:.88rem}.card{width:min(36rem,100%);margin:2rem auto;padding:clamp(1.2rem,5vw,2.4rem);background:white;border-radius:1rem;box-shadow:0 28px 65px #0004}.eyebrow{color:#17645f;font-size:.78rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}h1{margin:.5rem 0;font-size:clamp(2rem,8vw,3rem);line-height:1.08}.intro,.card>p:not(.eyebrow){color:#53615e;line-height:1.6}form{display:grid;gap:1rem;margin-top:1.4rem}label{display:grid;gap:.4rem;font-weight:800}input{width:100%;min-height:2.9rem;padding:.65rem .75rem;border:1px solid #9caea9;border-radius:.55rem}[aria-invalid=true]{border:2px solid #a32121}.error{color:#a32121;font-weight:750;font-size:.88rem}.button{display:inline-flex;min-height:2.9rem;align-items:center;justify-content:center;padding:.65rem 1rem;color:white;background:#17645f;border:1px solid #17645f;border-radius:.55rem;text-decoration:none;font-weight:850;cursor:pointer}.button:disabled{opacity:.6;cursor:wait}.back{display:block;margin-top:1.2rem;color:#0b514c;font-weight:800;text-align:center}.skip{position:fixed;top:.5rem;left:.5rem;z-index:2;padding:.7rem;background:white;border-radius:.5rem;transform:translateY(-180%)}.skip:focus{transform:none}:focus-visible{outline:3px solid #e6aa32;outline-offset:3px}@media(max-width:360px){header span{max-width:8rem;text-align:right;font-size:.78rem}}</style>
