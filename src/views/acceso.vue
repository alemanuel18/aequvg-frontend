<script setup lang="ts">
import type { StudentLoginErrors } from '~/composables/student-auth-validation'
import { PublicApiError } from '~/services/api'
import { getModerationFeedback, safeModerationFeedbackFields } from '~/utils/moderation-feedback'

useSeoMeta({ title: 'Acceso estudiantil', description: 'Inicio de sesión para estudiantes de UVG.' })
const route = useRoute()
const session = useStudentSession()
const fields = reactive({ email: '', password: '' })
const errors = ref<StudentLoginErrors>({})
const requestError = ref('')
const moderationCode = ref('')
const moderationFields = ref<Record<string, string>>({})
const submitting = ref(false)
const ready = ref(false)

const safeReturnTo = computed(() => {
  const value = typeof route.query.returnTo === 'string' ? route.query.returnTo : ''
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/administrador') ? value : '/mi-cuenta'
})

onMounted(async () => {
  if (await session.load()) {
    await navigateTo(safeReturnTo.value, { replace: true })
    return
  }
  ready.value = true
})

const submit = async () => {
  if (!ready.value || submitting.value) return
  errors.value = validateStudentLogin(fields)
  requestError.value = ''
  moderationCode.value = ''
  moderationFields.value = {}
  if (Object.keys(errors.value).length) return
  submitting.value = true
  try {
    await session.login({ email: fields.email.trim().toLowerCase(), password: fields.password })
    await navigateTo(safeReturnTo.value, { replace: true })
  } catch (error) {
    const feedback = error instanceof PublicApiError ? getModerationFeedback(error.code, error.fields) : null
    if (feedback && error instanceof PublicApiError) {
      moderationCode.value = error.code
      moderationFields.value = safeModerationFeedbackFields(error.fields)
    } else requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos iniciar sesión. Intenta nuevamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <StudentAuthCard title="Iniciar sesión" hint="Accede a tu espacio personal con tu cuenta estudiantil. Este acceso es independiente del panel administrativo.">
    <form novalidate @submit.prevent="submit">
      <div class="field">
        <label for="student-email">Correo institucional</label>
        <input id="student-email" v-model="fields.email" name="email" type="email" inputmode="email" autocomplete="username" maxlength="254" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'student-email-error' : undefined">
        <p v-if="errors.email" id="student-email-error" class="field-error">{{ errors.email }}</p>
      </div>
      <div class="field">
        <label for="student-password">Contraseña</label>
        <input id="student-password" v-model="fields.password" name="password" type="password" autocomplete="current-password" maxlength="256" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.password)" :aria-describedby="errors.password ? 'student-password-error' : undefined">
        <p v-if="errors.password" id="student-password-error" class="field-error">{{ errors.password }}</p>
      </div>
      <ModerationNotice v-if="moderationCode" :code="moderationCode" :fields="moderationFields" />
      <p v-if="requestError" class="form-message" role="alert">{{ requestError }}</p>
      <p class="sr-only" aria-live="polite">{{ submitting ? 'Verificando credenciales.' : '' }}</p>
      <AppButton type="submit" :disabled="!ready || submitting">{{ submitting ? 'Ingresando…' : 'Iniciar sesión' }}</AppButton>
      <NuxtLink class="auth-switch" to="/registro">¿Aún no tienes cuenta? Regístrate</NuxtLink>
    </form>
  </StudentAuthCard>
</template>

<style scoped>
form { display: grid; gap: 1.15rem; }
</style>
