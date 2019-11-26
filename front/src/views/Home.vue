<template>
  <div class="main">
    <div class="leftPanel">
      Lorem Ipsum
      <button @click="onCreateProject">Créer un film</button>
    </div>
    <div class="rightPanel"></div>
  </div>
</template>

<style>
.main {
  background: white;
  width: 100%;
  height: 100%;
}
</style>



<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import * as uuid from "uuid";

const ProjectNS = namespace("project");

@Component
export default class Init extends Vue {
  @ProjectNS.Action("loadProject")
  private loadProjectAction!: Function;

  @ProjectNS.Action("createPlan")
  private createPlanAction!: Function;

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  created() {
    if (this.isMobile()) {
      this.$router.push("/smartphone");
    }
  }

  async onCreateProject() {
    const projectId = uuid.v4();
    await this.loadProjectAction(projectId);
    await this.createPlanAction();
    await this.$router.push("/capture");
  }
}
</script>
