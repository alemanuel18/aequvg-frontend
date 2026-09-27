<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
import type { EventRegistrationInput } from '~/types/api'
import { validateEventRegistrationForm } from '~/composables/event-registration-validation'

const props = defineProps<{
  eventId: number
  eventName: string
  startsAt: string
  availableCapacity?: number
}>()

const emit = defineEmits<{
  (e: 'full'): void
}>()

const service = usePublicContentService()
const privacyVersion = useRuntimeConfig().public.privacyVersion

const submitting = ref(false)
const success = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const eventClosed = ref(false)
const closedMessage = ref('')
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  consent: false,
  website: ''
})

const clearForm = () => {
  form.fullName = ''
  form.email = ''
  form.phone = ''
  form.consent = false
  form.website = ''
  fieldErrors.value = {}
}

const isAlreadyStarted = computed(() => {
  if (!mounted.value || !props.startsAt) return false
  const time = new Date(props.startsAt).getTime()
  return !Number.isNaN(time) && time <= Date.now()
})

const isPreventivelyFull = computed(() => {
  return typeof props.availableCapacity === 'number' && props.availableCapacity <= 0
})

const validate = () => {
  const errors = validateEventRegistrationForm(form)
  fieldErrors.value = errors
  if (Object.keys(errors).length > 0) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey) {
      const fieldId = firstKey === 'fullName' ? 'reg-name' : `reg-${firstKey}`
      if (import.meta.client) {
        nextTick(() => {
          document.getElementById(fieldId)?.focus()
        })
      }
    }
    return false
  }
  return true
}

const submit = async () => {
  errorMessage.value = ''
  fieldErrors.value = {}

  if (submitting.value) return
  if (!validate()) return

  submitting.value = true
  try {
    const body: EventRegistrationInput = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      consent: true,
      privacyVersion,
      website: form.website || undefined
    }

    await service.registerForEvent(props.eventId, body)
    success.value = true
    clearForm()
  } catch (error) {
    if (error instanceof PublicApiError) {
      switch (error.code) {
        case 'ALREADY_REGISTERED':
          errorMessage.value = 'Ya existe una inscripción registrada con este correo electrónico para este evento.'
          fieldErrors.value.email = 'Este correo ya se encuentra registrado.'
          break
        case 'EVENT_FULL':
          eventClosed.value = true
          closedMessage.value = 'Este evento ha alcanzado su capacidad máxima.'
          emit('full')
          clearForm()
          break
        case 'EVENT_NOT_OPEN':
          eventClosed.value = true
          closedMessage.value = 'Este evento ya no acepta inscripciones.'
          clearForm()
          break
        case 'EVENT_ALREADY_STARTED':
          eventClosed.value = true
          closedMessage.value = 'Este evento ya inició. Las inscripciones se encuentran cerradas.'
          clearForm()
          break
        case 'EVENT_NOT_FOUND':
          eventClosed.value = true
          closedMessage.value = 'El evento solicitado ya no se encuentra disponible.'
          clearForm()
          break
        case 'CONSENT_REQUIRED':
          fieldErrors.value.consent = 'Debes aceptar la política de privacidad.'
          break
        case 'INVALID_PRIVACY_VERSION':
          errorMessage.value = 'No pudimos validar el aviso de privacidad. Recarga la página e intenta de nuevo.'
          break
        case 'INVALID_REQUEST':
          errorMessage.value = 'No pudimos procesar tu solicitud. Por favor intenta de nuevo.'
          break
        case 'RATE_LIMITED':
          errorMessage.value = 'Has enviado varias solicitudes seguidas. Por favor espera un momento antes de intentar de nuevo.'
          break
        case 'VALIDATION_ERROR':
          errorMessage.value = 'Por favor revisa los campos señalados antes de continuar.'
          break
        default:
          errorMessage.value = error.message || 'No pudimos procesar tu inscripción. Por favor intenta de nuevo.'
      }
    } else {
      errorMessage.value = 'No pudimos conectar con el servidor. Revisa tu conexión o intenta más tarde.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="registration-shell">
    <div v-if="success" class="registration-status-card registration-status-card--success" role="status">
      <div class="status-card__header">
        <span class="status-icon status-icon--success" aria-hidden="true">✓</span>
        <h3>¡Inscripción confirmada!</h3>
      </div>
      <p class="status-card__message">
        Has quedado inscrito exitosamente en <strong>{{ eventName }}</strong>.
      </p>
      <p class="status-card__notice">
        No es necesario que vuelvas a enviar el formulario.
      </p>
      <div class="status-card__actions">
        <AppButton to="/eventos" variant="secondary">← Ver todos los eventos</AppButton>
      </div>
    </div>

    <div v-else-if="isAlreadyStarted || isPreventivelyFull || eventClosed" class="registration-status-card registration-status-card--closed" role="status">
      <div class="status-card__header">
        <span class="status-icon status-icon--neutral" aria-hidden="true">ℹ</span>
        <h3>Inscripciones no disponibles</h3>
      </div>
      <p class="status-card__message">
        {{ closedMessage || (isAlreadyStarted ? 'Este evento ya inició. Las inscripciones se encuentran cerradas.' : (isPreventivelyFull ? 'Este evento ha alcanzado su capacidad máxima.' : 'Este evento ya inició. Las inscripciones se encuentran cerradas.')) }}
      </p>
      <div class="status-card__actions">
        <AppButton to="/eventos" variant="secondary">← Ver otros eventos</AppButton>
      </div>
    </div>

    <form v-else class="form-card" novalidate @submit.prevent="submit">
      <div class="form-header">
        <h3>Inscripción al evento</h3>
        <p>Completa tus datos para confirmar tu participación en esta actividad.</p>
      </div>

      <div class="form-grid">
        <div class="field">
          <label for="reg-name">Nombre completo</label>
          <input
            id="reg-name"
            v-model="form.fullName"
            autocomplete="name"
            :aria-invalid="!!fieldErrors.fullName"
            :aria-describedby="fieldErrors.fullName ? 'reg-name-error' : undefined"
            required
          >
          <span v-if="fieldErrors.fullName" id="reg-name-error" class="field-error">{{ fieldErrors.fullName }}</span>
        </div>

        <div class="field">
          <label for="reg-email">Correo electrónico</label>
          <input
            id="reg-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            :aria-invalid="!!fieldErrors.email"
            :aria-describedby="fieldErrors.email ? 'reg-email-error' : undefined"
            required
          >
          <span v-if="fieldErrors.email" id="reg-email-error" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <div class="field field--full">
          <label for="reg-phone">Teléfono</label>
          <input
            id="reg-phone"
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            :aria-invalid="!!fieldErrors.phone"
            :aria-describedby="fieldErrors.phone ? 'reg-phone-error' : undefined"
            required
          >
          <span v-if="fieldErrors.phone" id="reg-phone-error" class="field-error">{{ fieldErrors.phone }}</span>
        </div>

        <div class="honeypot" aria-hidden="true">
          <label for="reg-website">Sitio web</label>
          <input
            id="reg-website"
            v-model="form.website"
            tabindex="-1"
            autocomplete="off"
          >
        </div>

        <div class="field field--full">
          <label class="checkbox">
            <input
              id="reg-consent"
              v-model="form.consent"
              type="checkbox"
              :aria-invalid="!!fieldErrors.consent"
              :aria-describedby="fieldErrors.consent ? 'reg-consent-error' : undefined"
              required
            >
            <span>Autorizo el tratamiento de mis datos para la inscripción a este evento, conforme al aviso de privacidad vigente.</span>
          </label>
          <span v-if="fieldErrors.consent" id="reg-consent-error" class="field-error">{{ fieldErrors.consent }}</span>
        </div>

        <p v-if="errorMessage" class="form-status form-status--error field--full" role="alert">
          {{ errorMessage }}
        </p>

        <div class="field--full form-actions">
          <AppButton :disabled="submitting" type="submit">
            {{ submitting ? 'Inscribiendo…' : 'Inscribirme al evento' }}
          </AppButton>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.registration-shell {
  width: 100%;
}

.form-card {
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgb(26 43 24 / 7%);
}

.form-header {
  margin-bottom: 1.25rem;
}

.form-header h3 {
  margin: 0 0 .35rem;
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: var(--color-ink);
}

.form-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: .95rem;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: grid;
  align-content: start;
  gap: .35rem;
}

.field--full {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 800;
  color: var(--color-ink);
  font-size: .92rem;
}

.field input {
  width: 100%;
  min-height: 2.8rem;
  padding: .65rem .75rem;
  color: var(--color-ink);
  background: white;
  border: 1px solid #9ca397;
  border-radius: .55rem;
  font-size: 1rem;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 74, 43, 0.15);
}

.field-error {
  color: var(--color-danger);
  font-size: .85rem;
  font-weight: 700;
}

.checkbox {
  display: grid;
  grid-template-columns: 1.2rem 1fr;
  gap: .65rem;
  align-items: start;
  cursor: pointer;
}

.checkbox input {
  width: 1.15rem;
  height: 1.15rem;
  margin-top: .25rem;
  cursor: pointer;
}

.checkbox span {
  font-size: .92rem;
  color: var(--color-ink);
  line-height: 1.45;
}

.honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.form-status {
  padding: .9rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: .6rem;
  font-size: .95rem;
  line-height: 1.5;
}

.form-status--error {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: #fdf5f5;
  font-weight: 600;
}

.form-actions {
  margin-top: .5rem;
}

.registration-status-card {
  padding: clamp(1.5rem, 4vw, 2.25rem);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgb(26 43 24 / 7%);
}

.registration-status-card--success {
  border-left: 6px solid var(--color-primary);
  background: #fbfdfb;
}

.registration-status-card--closed {
  border-left: 6px solid #8c928b;
  background: #fafafa;
}

.status-card__header {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: .75rem;
}

.status-card__header h3 {
  margin: 0;
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  color: var(--color-ink);
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-weight: 800;
  font-size: 1.1rem;
}

.status-icon--success {
  background: var(--color-primary);
  color: white;
}

.status-icon--neutral {
  background: #8c928b;
  color: white;
}

.status-card__message {
  margin: 0 0 .5rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-ink);
}

.status-card__notice {
  margin: 0 0 1.25rem;
  font-size: .92rem;
  color: var(--color-muted);
}

.status-card__actions {
  margin-top: 1rem;
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field--full {
    grid-column: auto;
  }
}
</style>
