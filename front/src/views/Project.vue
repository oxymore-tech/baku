<template>
  <div>{{ this.$route.params.projectid}}</div>
</template>

<style>
ul {
  margin-left: 16px;
}
</style>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";

const ProjectNS = namespace("project");

@Component
export default class Project extends Vue {
  @ProjectNS.Action("loadProject")
  private loadProjectAction!: Function;

  @ProjectNS.State
  public history!: string;

  public async created() {
    const projectId = this.$route.params.projectid;
    if (projectId === undefined) {
      await this.$router.push("/home");
      return;
    }
    await this.loadProjectAction(projectId);
    await this.$router.push("/capture");
  }
}
</script>
