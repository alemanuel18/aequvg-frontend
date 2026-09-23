<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
import type { ContactRequestInput } from '~/types/api'
import { validateContactForm } from '~/composables/contact-validation'

const service = usePublicContentService()
const privacyVersion = useRuntimeConfig().public.privacyVersion
const submitting = ref(false)
const success = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const form = reactive({ name: '', email: '', phone: '', type: 'CONSULTA' as 'CONSULTA' | 'REUNION', subject: '', message: '', preferredAt: '', consent: false, website: '' })

const validate = () => {
  const errors = validateContactForm(form)
  fieldErrors.value = errors
  return !Object.keys(errors).length
}

const submit = async () => {
  success.value = false; errorMessage.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const body: ContactRequestInput = { name: form.name, email: form.email, phone: form.phone, type: form.type, subject: form.subject, message: form.message, preferredAt: form.preferredAt ? new Date(form.preferredAt).toISOString() : null, consent: true, privacyVersion, website: form.website }
    await service.sendContactRequest(body)
    success.value = true
    Object.assign(form, { name: '', email: '', phone: '', type: 'CONSULTA', subject: '', message: '', preferredAt: '', consent: false, website: '' })
  } catch (error) { errorMessage.value = error instanceof PublicApiError ? error.message : 'No pudimos enviar tu solicitud.' }
  finally { submitting.value = false }
}
</script>
<template>
  <form class="form-card" novalidate @submit.prevent="submit">
    <div class="form-grid">
      <div class="field"><label for="contact-name">Nombre completo</label><input id="contact-name" v-model="form.name" autocomplete="name" :aria-invalid="!!fieldErrors.name" :aria-describedby="fieldErrors.name ? 'name-error' : undefined" required><span v-if="fieldErrors.name" id="name-error" class="field-error">{{ fieldErrors.name }}</span></div>
      <div class="field"><label for="contact-email">Correo electrónico</label><input id="contact-email" v-model="form.email" type="email" autocomplete="email" :aria-invalid="!!fieldErrors.email" required><span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span></div>
      <div class="field"><label for="contact-phone">Teléfono</label><input id="contact-phone" v-model="form.phone" type="tel" autocomplete="tel" :aria-invalid="!!fieldErrors.phone" required><span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span></div>
      <div class="field"><label for="contact-type">¿Cómo podemos ayudarte?</label><select id="contact-type" v-model="form.type"><option value="CONSULTA">Quiero hacer una consulta</option><option value="REUNION">Quiero solicitar una reunión</option></select></div>
      <div v-if="form.type === 'REUNION'" class="field field--full"><label for="preferred-at">Fecha y hora tentativa</label><input id="preferred-at" v-model="form.preferredAt" type="datetime-local" :aria-invalid="!!fieldErrors.preferredAt"><span v-if="fieldErrors.preferredAt" class="field-error">{{ fieldErrors.preferredAt }}</span></div>
      <div class="field field--full"><label for="contact-subject">Asunto</label><input id="contact-subject" v-model="form.subject" :aria-invalid="!!fieldErrors.subject" required><span v-if="fieldErrors.subject" class="field-error">{{ fieldErrors.subject }}</span></div>
      <div class="field field--full"><label for="contact-message">Mensaje</label><textarea id="contact-message" v-model="form.message" :aria-invalid="!!fieldErrors.message" required /><span v-if="fieldErrors.message" class="field-error">{{ fieldErrors.message }}</span></div>
      <div class="honeypot" aria-hidden="true"><label for="website">Sitio web</label><input id="website" v-model="form.website" tabindex="-1" autocomplete="off"></div>
      <div class="field field--full"><label class="checkbox"><input v-model="form.consent" type="checkbox" required><span>Autorizo el tratamiento de mis datos para atender esta solicitud, conforme al aviso de privacidad vigente.</span></label><span v-if="fieldErrors.consent" class="field-error">{{ fieldErrors.consent }}</span></div>
      <p v-if="success" class="form-status field--full" role="status">Recibimos tu solicitud. La Asociación podrá responderte por los datos proporcionados.</p>
      <p v-if="errorMessage" class="form-status form-status--error field--full" role="alert">{{ errorMessage }}</p>
      <div class="field--full"><AppButton :disabled="submitting" type="submit">{{ submitting ? 'Enviando…' : 'Enviar solicitud' }}</AppButton></div>
    </div>
  </form>
</template>

<style scoped>
.form-card {
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgb(26 43 24 / 7%);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field { display: grid; align-content: start; gap: .35rem; }
.field--full { grid-column: 1 / -1; }
.field label { font-weight: 800; }

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 2.8rem;
  padding: .65rem .75rem;
  color: var(--color-ink);
  background: white;
  border: 1px solid #9ca397;
  border-radius: .55rem;
}

.field textarea { min-height: 9rem; resize: vertical; }
.field-error { color: var(--color-danger); font-size: .85rem; font-weight: 700; }
.checkbox { display: grid; grid-template-columns: 1.2rem 1fr; gap: .65rem; align-items: start; }
.checkbox input { width: 1.15rem; height: 1.15rem; margin-top: .25rem; }
.honeypot { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
.form-status { padding: .9rem; background: white; border: 1px solid var(--color-border); border-radius: .6rem; }
.form-status--error { color: var(--color-danger); border-color: var(--color-danger); }

@media (max-width: 620px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: auto; }
}
</style>
