<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
  <AppToastContainer />
</template>

<script setup lang="ts">
import { APP_THEME } from "~/config/theme";

useHead({
  htmlAttrs: { "data-app-theme": APP_THEME },
});
</script>
