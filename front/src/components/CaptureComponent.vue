<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer captureContainer">
      <h3>mode capture</h3>
      <QrGenerator/>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import QrGenerator from "@/components/QrGenerator.vue";

@Component({
  components: {
    QrGenerator
  }
})
export default class CaptureComponent extends Vue {
}
</script>

<style lang="scss">
    .captureContainer {
        width: 290px;
        height: 450px;
        display: flex;
        justify-content: flex-start;
        flex-direction: column;
        align-items: center;
        
        h3 {
            font-size: 23px;
            font-weight: bold;
        }
    }
</style>