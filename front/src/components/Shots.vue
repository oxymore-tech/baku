<template>
  <div class="shots">
    <div class="shotsTitle">
      <h3>Choisir un plan</h3>

      <button 
         v-if="projectId"
         @click="openCurrentShot()">
         Accéder au dernier plan</button>

    </div>
    <div class="shotCardsContainer">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shotCard"
        v-bind:class="{ active: shot.id === activeShotId}"
      >
        <img
          v-if="shot.images[0]"
          class="shotPreview"
          :src="`/${projectId}/images/${shot.id}/${shot.images[0]}?width=292&height=193`"
        />
        <div
          class="shotPreview"
          v-else
        ></div>
        <div class="cardFooter">
          <span class="shotName">{{shot.name}}</span>
          <input
            v-model="shot.name"
            type="text"
            class="shotName"/>
          <a
            class="activateShot"
            @click="renameShot(shot.id)"
          >Renommer le plan</a>
          <a
            class="activateShot"
            @click="activateShot(shot.id)"
          >Ouvrir le plan</a>
        </div>
      </div>
      <div class="shotCard">
        <div class="shotPreview"></div>
        <div class="cardFooter">
          <span class="shotName">Nouveau Plan</span>
          <a
            class="activateShot"
            @click="createNewShot()"
          >Créer un nouveau plan</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.shots {
  width: 100%;
  height: 100%;
  background: #f2f2f2;
  display: flex;
  flex-direction: column;

  .shotsTitle {
    margin: 0 24px;

    h3 {
      font-size: 28px;
      font-weight: bold;
    }
  }
}

.shotCardsContainer {
  width: 100%;
  flex: 1;
  display: flex;
}

.shotPreview {
  width: 100%;
  height: 193px;
  background-color: #bce0fd;
}

.shotCard {
  width: 292px;
  height: 300px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border-radius: 16px;
  opacity: 1;
  margin: 24px;
  font-size: 16px/6px;
  letter-spacing: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .cardFooter {
    padding: 7px;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .shotName {
    text-align: left;
    color: #455054;
  }

  .activateShot {
    color: #e66359;
    text-align: right;
  }
}

.active {
  box-shadow: 0px 0px 20px #00000029;
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Shot } from '../api/movie.service';

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public shots!: Shot[];

  @Prop({ required: true })
  public activeShotId!: string;

  @Prop({ required: true })
  public projectId!: string;

  public openCurrentShot() {
    this.$emit('openCurrentShot');
  }

  public activateShot(id: string) {
    const shotIndex = this.shots.findIndex((shot) => shot.id === id);
    this.$store.dispatch('project/changeActiveShot', shotIndex);
    this.$router.push('/movies/' + this.projectId + '/shots/' + id);
  }

  public renameShot(shotId: string) {
    const selectedShot = this.shots.find((shot) => shot.id === shotId);
    if (selectedShot) {
      this.$store.dispatch('project/renameShot', { shotId, name: selectedShot.name });
    }
  }

  public createNewShot() {
    this.$store.dispatch('project/createShot', 'Nouveau Plan');
  }
}
</script>
