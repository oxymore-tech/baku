<template>
  <div>
    <h1>Smartphone LocalVideo</h1>
    <video id="localVideo" playsinline autoplay muted></video>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

@Component
export default class Smartphone extends Vue {}
</script>