<template>
  <div class="shots">
    <div class="shotsTitle">
      <h3>Choisir un plan</h3>
      <button v-if="activeShotId" class="createButton" @click="close()">Retour au plan précédent</button>
    </div>
    <div class="shotCardsContainer">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shotCard"
        v-bind:class="{ active: shot.id === activeShotId}"
      >
        <a class="activateShot" @click="activateShot(shot.id)">
          <img
            class="shotPreview"
            :src="shot.preview"
          />
          <div class="cardFooter">
            <p> {{ shot.name }} </p>
          </div>
        </a>
      </div>
      <div class="shotCard">
        <div class="shotPreview"></div>
        <div class="cardFooter">
          <span class="shotName">Nouveau Plan</span>
          <a class="activateShot" @click="createNewShot()">Créer un nouveau plan</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">

.createButton {
  margin: 24px 0 0 auto;
  width: 292px;
  height: 48px;
  background: #e66359 0% 0% no-repeat padding-box;
  box-shadow: 0px 0px 20px #00000029;
  border-radius: 44px;
  color: white;
  border: 0;
  cursor: pointer;
  font-size: 16px;
}

.shots {
  width: 100%;
  height: 100%;
  background: #f2f2f2;
  display: flex;
  flex-direction: column;

  .shotsTitle {
    margin: 0 24px;
    display: inline-flex;
    align-items: baseline;
    justify-content: space-between;

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
  height: 241px;
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
    text-align: center;
    color: #455054;
  }

  .activateShot {
    color: #e66359;
    text-align: center;
  }
}

.active {
  box-shadow: 0px 0px 20px #00000029;
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

type Shot = {
  id: string;
  name: string;
  preview: string;
}

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @Prop({ required: true })
  public activeShotId!: string;

  get shots(): Shots {
    return this.$store.getters['project/movie'].shots.map((shot: any, index: any): Shot => {
      let preview = '';
      if (shot.images[0]) {
        preview = `/images/thumb/${this.projectId}/${shot.images[0]}`;
      } else {
        preview = 'https://cdn.pixabay.com/photo/2016/09/11/18/26/frame-1662287_960_720.png';
      }

      return {
        id: shot.id,
        name: `Plan ${index + 1}`,
        preview,
      };
    });
  }

  public createNewShot() {
    this.$store.dispatch('project/createShot');
  }

  public activateShot(shotId: string) {
    this.$store.dispatch('project/changeActiveShot', shotId);
    this.$emit('close');
  }

  public close() {
    this.$emit('close');
  }
}
</script>
