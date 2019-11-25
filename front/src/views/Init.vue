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
  public static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public created() {
    if (Init.isMobile()) {
      this.$router.push('/smartphone');
    } else {
      this.$router.push('/capture');
    }
  }
}
</script>
