<template>
  <div>
    <!-- <SmartphoneLocalVideoComponent v-if="isConnected" /> -->
    <QrReaderComponent />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { State } from 'vuex-class';
// import SmartphoneLocalVideoComponent from '@/components/smartphone/SmartphoneLocalVideoComponent.vue';
import QrReaderComponent from '@/components/smartphone/QrReaderComponent.vue';
import store from '@/store';


@Component({
  components: {
    // SmartphoneLocalVideoComponent,
    QrReaderComponent,
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
