<template>
  <div>
    <Smartphone v-if="isConnected" />
    <QrReader v-else />
  </div>
</template>

<script lang="ts">
import Smartphone from '@/components/Smartphone.vue';
import QrReader from '@/components/QrReader.vue';
import { Component, Vue } from 'vue-property-decorator';
import { State } from 'vuex-class';
import store from '@/store';


@Component({
  components: {
    Smartphone,
    QrReader,
  },
  store,
})
export default class SmartphoneView extends Vue {
  @State
  public isConnected!: boolean;
}
</script>

<style>
</style>
