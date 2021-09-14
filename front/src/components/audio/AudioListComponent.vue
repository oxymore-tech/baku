<style lang="scss" scoped>
  @import "@/styles/audioList.scss";
</style>

<template>
  <div class="audio-list">
    <div class="audio-list-container">
        <div
          v-for="audio in getAudioRecord"
          class="sounds"
          draggable="true"
          @dragstart="handleDragStart($event,audio.id);"
        >
          <div class="border">
          
            <div
              class="horizontal-align"
            >
                {{ audio.title }}
            </div>
            
            <span class="tools">
              <div class="tool create-button-modify" @click="openEditSoundPopup(audio.id,projectId)">
              </div>


              <div class="tool create-button-play" @click="playSound(audio.id)">
              </div>

              <div class="tool create-button-delete" @click="deleteSound(audio.id)">
              </div>
            </span>
          </div>
        </div>
    </div>

    <div class="record-Button">
      <button class="button is-primary" @click="openRecordPopup(projectId)">Enregistrer un son</button>
      <button class="button is-primary" @click="stopPlayer()">Stopper la lecture des sons</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/utils/movie.service';
import { Howl } from 'howler';
// import { Spinner } from "@/utils/spinner.class";
// import { ImageCacheService } from "@/utils/imageCache.service";
import RecordPopup from '@/components/RecordPopup.vue';
import EditSoundPopup from '@/components/EditSoundPopup.vue';
import * as api from '@/api';

const ProjectNS = namespace('project');
@Component
export default class AudioListComponent extends Vue {
    
    @Prop()
    public activeShot!: Shot;

    @Prop()
    public shots!: Shot[];

    @Prop()
    public isPlaying: 'animation' | 'selection' | null = null;

    @Prop()
    public projectId!: string;

    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    protected getAudioRecord!: any;

    private sound!: Howl;

    private alreadyPlayedOnce: boolean = false;

    public async mounted() {
      await this.$store.dispatch('project/loadProject', this.$route.params.projectId); 
      await this.loadSounds();
    }

    private async loadSounds(){
      this.getAudioRecord.forEach(async (audio: any) => {
        let path : string = api.getSoundUrl(this.projectId, audio.id);
        let blob = await fetch(path).then(res => res.blob()).then(data => new Blob([data], { type: 'audio/wav' }));
        await this.$store.dispatch('project/loadAudioSound', { audioId : audio.id, sound : blob});
      });
    }


    handleDragStart(event: any, id: string) {
      event.dataTransfer.setData("text", id);
    }

    public async openRecordPopup(projectId:string) {
      this.$buefy.modal.open({
        parent: this,
        component: RecordPopup,
        hasModalCard: true,
        canCancel: ['escape', 'outside'],
        props: {
          "projectId": projectId
        }
      });
    }

    public async openEditSoundPopup(id: string, projectId: string) {
      this.$buefy.modal.open({
        parent: this,
        component: EditSoundPopup,
        hasModalCard: true,
        canCancel: ['escape', 'outside'],
        props: {
          "id": id,
          "projectId": projectId
        }
      });
    }

    public playSound(audioId : string) {
      if (this.alreadyPlayedOnce) {
        if (this.sound.playing()) {
          this.sound.stop();
          let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === audioId).sound);
          let volume = this.getAudioRecord.find((audio: any) => audio.id === audioId).volume;
          this.sound = new Howl({
            src: [url],
            format: ['wav'],
            volume: parseFloat((volume/100).toFixed(2))
        });
          this.sound.play();
        } else {
          let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === audioId).sound);
          let volume = this.getAudioRecord.find((audio: any) => audio.id === audioId).volume;
          this.sound = new Howl({
            src: [url],
            format: ['wav'],
            volume: parseFloat((volume/100).toFixed(2))
          });
          this.sound.play();
        }
      } else {
        let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === audioId).sound);
        let volume = this.getAudioRecord.find((audio: any) => audio.id === audioId).volume;
        this.sound = new Howl({
            src: [url],
            format: ['wav'],
            volume: parseFloat((volume/100).toFixed(2))
        });
        this.sound.play();
        this.alreadyPlayedOnce = true;
      }
    }

    public async deleteSound(audioId: string) {   
      if (!this.isPlaying) {
        await this.$store.dispatch('project/removeAudio', audioId);
      }   
    }

    public stopPlayer() {
      if (this.alreadyPlayedOnce) {
        this.sound.stop();
      }
    }
}
</script>