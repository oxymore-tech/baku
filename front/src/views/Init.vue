<template>
  <div></div>
</template>

<style>
ul {
  margin-left: 16px;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Init extends Vue {

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public created() {
    if (this.isMobile()) {
      this.$router.push('/smartphone');
    } else {
      this.$router.push('/capture');
    }
  }
}

</script>