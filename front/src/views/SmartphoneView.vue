<template>
  <div>
    <HelloWorld v-if="isConnected" />
    <QrReader v-else />
  </div>
</template>

<script lang="ts">
import Smartphone from "@/components/Smartphone.vue";
import QrReader from "@/components/QrReader.vue";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import { Getter } from "vuex-class";

@Component({
  components: {
    Smartphone,
    QrReader
  }
})
export default class SmartphoneView extends Vue {
  @Getter
  isConnected = false;
}
</script>

<style>
</style>
