<template>
  <div class="boxContainer storyboard-preview-container">
    <div>
      <h4>Storyboard</h4>
      <button @click="onDisplayShots()">Voir la liste des plans</button>
    </div>
    <img src="@/assets/storyboard.png" />
  </div>
</template>

<style lang="scss">
.storyboard-preview-container {
  width: 290px;
  height: 256px;

  h4 {
    font-size: 28px;
    font-weight: bold;
  }
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Shot } from '@/api/movie.service';
import { namespace } from "vuex-class";

const ProjectNS = namespace("project");
@Component
export default class StoryboardPreviewComponent extends Vue {
  @Prop({ required: true })
  public shots!: Shot[];

  @Prop()
  public activeShotId!: string;

  @Prop()
  public displayShots!: boolean;

  @ProjectNS.State
  public id!: string;

  public onDisplayShots() {
    this.$router.push('/movies/' + this.id + '/shots/');
  }
}
</script>
