<template>
  <div class="main-frame">
    <Shots
      :projectId="id"
      :shots="movie.shots"
      :activeShotId="activeShotId"
      v-on:close="openCapture"
    />
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import store from '@/store';
import Shots from '@/components/Shots.vue';
import { Movie } from '@/utils/movie.service';
import AbstractProjectView from '@/views/AbstractProjectView.vue';

const ProjectNS = namespace('project');
@Component({
  components: {
    Shots,
  },
  store,
})
export default class CaptureView extends AbstractProjectView {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.State
  public activeShotId!: string;

  public async openCapture() {
    await this.$router.push({
      name: 'captureShot',
      params: {
        projectId: this.id,
        shotId: this.activeShotId,
      },
    });
  }
}
</script>
