<template>
  <div></div>
</template>

<style>
  ul {
    margin-left: 16px;
  }
</style>

<script lang="ts">
  import {Component, Vue} from "vue-property-decorator";
  import {namespace} from "vuex-class";

  const ProjectNS = namespace("project");

  @Component
  export default class Init extends Vue {

    @ProjectNS.Action("loadProject")
    private loadProjectAction!: Function;

    public isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    public async created() {
      const projectId = this.$route.query.project || "default";
      await this.loadProjectAction(projectId);
      if (this.isMobile()) {
        await this.$router.push("/smartphone");
      } else {
        await this.$router.push("/capture");
      }
    }
  }

</script>