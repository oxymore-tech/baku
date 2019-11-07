<template>
  <div></div>
</template>

<style>
ul {
  margin-left: 16px;
}
</style>

<script>
export default {
  name: "Init",
  methods: {
    isMobile() {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        return true;
      } else {
        return false;
      }
    }
  },
  created() {
    if (this.isMobile()) {
      this.$router.push("/smartphone");
    } else {
      this.$router.push("/capture");
    }
  }
};
</script>