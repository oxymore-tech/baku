<template>
  <div class="mainFrame">
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
import { Movie, Shot } from '@/api/movie.service';
import Project from './Project.vue';

const ProjectNS = namespace('project');
@Component({
  components: {
    Shots,
  },
  store,
})
export default class Capture extends Project {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.State
  public activeShotId!: string;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

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

<style lang="scss" scoped>
.mainFrame {
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
}
</style>
