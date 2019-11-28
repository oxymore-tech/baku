<template>
  <div class="boxContainer storyboard-preview-container">
    <div>
      <h4>Storyboard</h4>
      <button @click="onDisplayPlansStack()">Le bouton pour ouvrir la stack</button>
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
import { Plan } from '@/api/film.service';

@Component
export default class StoryboardPreviewComponent extends Vue {
  @Prop({ required: true })
  public plans!: Plan[];

  @Prop()
  public activePlanId!: string;

  @Prop()
  public displayPlansStack!: boolean;

  public onDisplayPlansStack() {
    this.$emit('changedisplayplansstack');
  }
}
</script>
