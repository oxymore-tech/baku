<template>
  <div class="mainFrame">
    <Shots
      :projectId="id"
      :shots="movie.shots"
      :activeShotId="getActiveShotId"
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

  @ProjectNS.Getter
  public getActiveShotId!: string;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  public async openCapture() {
    await this.$router.push({
      name: 'captureShot',
      params: {
        projectId: this.id,
        shotId: this.getActiveShotId,
      },
    });
  }
}
</script>

<style lang="scss">
.mainFrame {
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
}

.previewBloc {
  display: flex;
  width: 100%;
  flex: 1;
  justify-content: space-around;
  padding: 10px 0;
}

#previewImg {
  min-width: 640px;
  min-height: 480px;
  max-height: 720px;
  height: 100%;
  max-width: 100%;
  background: white;
}

.previewContainer {
  width: 1100px;
  height: 619px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 4px solid #455054;
  border-radius: 4px;
  box-sizing: content-box;
}

#videoCapture {
  max-height: 720px;
}
</style>
