<template>
  <div class="shots">
    <div class="shotCardsContainer">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shotCard"
      >
        <a
          class="activateShot"
          @click="activateShot(shot.id)"
        >
          <img
            class="shotPreview"
            :src="shot.previewUrl"
            alt="shotPreview"
          />
          <div class="cardFooter">
            <p>{{ shot.name }}</p>
          </div>
        </a>

        <b-dropdown
          aria-role="list"
          class="shot-menu is-pulled-right"
          position="is-bottom-left"
        >
          <a slot="trigger">
            <b-icon
              custom-class="icon-cog"
            ></b-icon>
          </a>
          <b-dropdown-item aria-role="listitem">(TODO) Exporter en séquence d'image</b-dropdown-item>
          <b-dropdown-item aria-role="listitem">(TODO) Exporter en fichier vidéo</b-dropdown-item>
          <b-dropdown-item aria-role="listitem">(TODO) Supprimer le plan</b-dropdown-item>
        </b-dropdown>
      </div>
      <div
        class="shotCard createShot"
        @click="createNewShot()"
      >
        <img
          src="@/assets/plus.svg"
          alt="plus"
          width="48px"
          height="48px"
        />
        <a class="activateShot">Créer un plan</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.createButton {
  margin: 24px 0 0 auto;
  width: 292px;
  height: 48px;
  background: #fe676f 0 0 no-repeat padding-box;
  box-shadow: 0 0 20px #00000029;
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
  flex-wrap: wrap;
  overflow-y: auto;
}

.shotPreview {
  width: 100%;
  height: 164px;
  max-width: unset;
}

.shotCard {
  width: 292px;
  height: 241px;
  background: #ffffff 0 0 no-repeat padding-box;
  border-radius: 16px;
  opacity: 1;
  margin: 24px;
  font-size: 16px/6px;
  letter-spacing: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;

  .cardFooter {
    padding: 7px;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
  }

  .shotName {
    text-align: center;
    color: #455054;
  }

  .activateShot {
    color: #fe676f;
    text-align: center;
  }

  .shot-menu {
    position: absolute;
    align-self: flex-end;
  }
}

.createShot {
  justify-content: center;
  align-items: center;

  img {
    cursor: pointer;
  }
}

.shotCard:hover {
  box-shadow: 0 0 20px #00000029;
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Spinner } from '@/api/spinner.class';
import { Quality } from '@/api/uploadedImage.class';

type Shot = {
  id: string;
  name: string;
  previewUrl: string;
};

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @Prop({ required: true })
  public activeShotId!: string;

  get shots(): Shots {
    return this.$store.getters['project/movie'].shots.map(
      (shot: any, index: any): Shot => {
        const previewUrl = shot.images[0] ? shot.images[0].getUrl(Quality.Original) : Spinner;

        return {
          id: shot.id,
          name: `Plan ${index + 1}`,
          previewUrl,
        };
      },
    );
  }

  public async createNewShot() {
    const shotId = await this.$store.dispatch('project/createShot');
    await this.$store.dispatch('project/changeActiveShot', shotId);
    this.$emit('close');
  }

  public async activateShot(shotId: string) {
    await this.$store.dispatch('project/changeActiveShot', shotId);
    this.$emit('close');
  }

  public close() {
    this.$emit('close');
  }
}
</script>
