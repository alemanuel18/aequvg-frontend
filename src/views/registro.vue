<script setup lang="ts">
import type { StudentRegistrationErrors } from '~/composables/student-auth-validation'
import { PublicApiError } from '~/services/api'
import { useStudentAuthApi } from '~/services/student-auth'
import { getModerationFeedback } from '~/utils/moderation-feedback'

useSeoMeta({ title: 'Registro estudiantil', description: 'Creación de cuenta para estudiantes actuales de UVG.' })
const session = useStudentSession()
const authApi = useStudentAuthApi()
const fields = reactive({ firstNames: '', lastNames: '', email: '', password: '', passwordConfirmation: '', isStudent: false })
const errors = ref<StudentRegistrationErrors>({})
const requestError = ref('')
const moderationCode = ref('')
const submitting = ref(false)
const ready = ref(false)

onMounted(async () => {
  if (await session.load()) {
    await navigateTo('/mi-cuenta', { replace: true })
    return
  }
  ready.value = true
})

const submit = async () => {
  if (!ready.value || submitting.value) return
  errors.value = validateStudentRegistration(fields)
  requestError.value = ''
  moderationCode.value = ''
  if (Object.keys(errors.value).length) return
  submitting.value = true
  try {
    const credentials = { email: fields.email.trim().toLowerCase(), password: fields.password }
    await authApi.register({ firstNames: fields.firstNames.trim(), lastNames: fields.lastNames.trim(), ...credentials, isStudent: true })
    await session.login(credentials)
    await navigateTo('/mi-cuenta', { replace: true })
  } catch (error) {
    const feedback = error instanceof PublicApiError ? getModerationFeedback(error.code, error.fields) : null
    if (feedback && error instanceof PublicApiError) moderationCode.value = error.code
    else requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos crear tu cuenta. Intenta nuevamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <StudentAuthCard title="Crear tu cuenta" hint="Registro exclusivo para estudiantes actuales de UVG. Las personas aspirantes todavía no forman parte de este acceso.">
    <form novalidate @submit.prevent="submit">
      <div class="field">
        <label for="registration-first-names">Nombres</label>
        <input id="registration-first-names" v-model="fields.firstNames" name="firstNames" type="text" autocomplete="given-name" maxlength="80" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.firstNames)" :aria-describedby="errors.firstNames ? 'registration-first-names-error' : undefined">
        <p v-if="errors.firstNames" id="registration-first-names-error" class="field-error">{{ errors.firstNames }}</p>
      </div>
      <div class="field">
        <label for="registration-last-names">Apellidos</label>
        <input id="registration-last-names" v-model="fields.lastNames" name="lastNames" type="text" autocomplete="family-name" maxlength="80" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.lastNames)" :aria-describedby="errors.lastNames ? 'registration-last-names-error' : undefined">
        <p v-if="errors.lastNames" id="registration-last-names-error" class="field-error">{{ errors.lastNames }}</p>
      </div>
      <div class="field">
        <label for="registration-email">Correo institucional</label>
        <input id="registration-email" v-model="fields.email" name="email" type="email" inputmode="email" autocomplete="username" maxlength="254" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'registration-email-error' : 'registration-email-hint'">
        <p id="registration-email-hint" class="field-hint">Debe terminar en @uvg.edu.gt.</p>
        <p v-if="errors.email" id="registration-email-error" class="field-error">{{ errors.email }}</p>
      </div>
      <div class="field">
        <label for="registration-password">Contraseña</label>
        <input id="registration-password" v-model="fields.password" name="password" type="password" autocomplete="new-password" maxlength="128" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.password)" :aria-describedby="errors.password ? 'registration-password-error' : 'registration-password-hint'">
        <p id="registration-password-hint" class="field-hint">12 caracteres como mínimo, con mayúscula, minúscula, número y símbolo.</p>
        <p v-if="errors.password" id="registration-password-error" class="field-error">{{ errors.password }}</p>
      </div>
      <div class="field">
        <label for="registration-password-confirmation">Confirmar contraseña</label>
        <input id="registration-password-confirmation" v-model="fields.passwordConfirmation" name="passwordConfirmation" type="password" autocomplete="new-password" maxlength="128" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.passwordConfirmation)" :aria-describedby="errors.passwordConfirmation ? 'registration-password-confirmation-error' : undefined">
        <p v-if="errors.passwordConfirmation" id="registration-password-confirmation-error" class="field-error">{{ errors.passwordConfirmation }}</p>
      </div>
      <div class="student-confirmation">
        <input id="registration-student" v-model="fields.isStudent" name="isStudent" type="checkbox" :disabled="!ready || submitting" :aria-invalid="Boolean(errors.isStudent)" :aria-describedby="errors.isStudent ? 'registration-student-error' : undefined">
        <label for="registration-student">Confirmo que actualmente soy estudiante de la Universidad del Valle de Guatemala.</label>
      </div>
      <p v-if="errors.isStudent" id="registration-student-error" class="field-error">{{ errors.isStudent }}</p>
      <ModerationNotice v-if="moderationCode" :code="moderationCode" />
      <p v-if="requestError" class="form-message" role="alert">{{ requestError }}</p>
      <p class="sr-only" aria-live="polite">{{ submitting ? 'Creando la cuenta e iniciando sesión.' : '' }}</p>
      <AppButton type="submit" :disabled="!ready || submitting">{{ submitting ? 'Creando cuenta…' : 'Crear cuenta' }}</AppButton>
      <NuxtLink class="auth-switch" to="/acceso">¿Ya tienes cuenta? Inicia sesión</NuxtLink>
    </form>
  </StudentAuthCard>
</template>

<style scoped>
form { display: grid; gap: 1rem; }
.field-hint { color: var(--color-muted); font-size: .86rem; }
.student-confirmation { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: .65rem; }
.student-confirmation input { width: 1.15rem; height: 1.15rem; margin-top: .25rem; accent-color: var(--color-primary); }
</style>
