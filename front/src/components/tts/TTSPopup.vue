<script lang="ts">
import { Component,Prop,Vue } from 'vue-property-decorator';
import * as api from '@/api';
import uuid from 'uuid';
import { namespace } from 'vuex-class';

const ProjectNS = namespace('project');

@Component
export default class RecordPopup extends Vue {

  @ProjectNS.Getter
  protected getAudioRecord!: any;

  @Prop()
  public projectId! : string;

  //previewCreated: false,
  public currentMsg: string ="";
  public pitch: number = 50;
  public rate: number = 1;
  public voiceSelected: any = null;
  public fileName: number = 0;
  public voicesOptions: any = null;
  private buttonListenActive: boolean = true;
  private buttonGenerateActive: boolean = true;

  public async mounted() {
    this.voicesOptions =  {
      Pierre: 'upmc-pierre-hsmm',
      Jessica: 'upmc-jessica-hsmm',
      Dennys: 'enst-dennys-hsmm',
      Camille: 'enst-camille-hsmm'
    }
    this.voiceSelected = this.voicesOptions.Pierre;
  }

  public async listenAudio() {
    if (this.currentMsg !== "" && this.buttonListenActive) {
      this.buttonListenActive = false;
      let response = await api.listenWav(this.projectId, this.currentMsg, this.voiceSelected, this.rate.toString())
      if (response.path === 'error') {
        this.buttonListenActive = true
        return;
      }
      let url = api.getSoundUrl(this.projectId, 'preview') + "?cb=" + new Date().getTime();
      let audio = new Audio(url);
      await audio.play();
      audio.onended = () => {
        this.buttonListenActive = true;
      }
    }
  }

  public async generateAudio() {
    if (this.currentMsg !== "" && this.buttonGenerateActive) {
      this.buttonGenerateActive = false
      this.fileName = this.getAudioRecord.length+1;
      let audioId = uuid.v4();
      let response = await api.generateWav(this.projectId, this.currentMsg, this.voiceSelected, audioId, this.rate.toString());
      if (response.duration === 'error') {
        this.buttonGenerateActive = true
        return;
      }
      let blob = await fetch(api.getSoundUrl(this.projectId, audioId))
        .then(res => res.blob())
        .then(data => new Blob ([data], { type: 'audio/wav' }));
      await this.$store.dispatch('project/createWav', {
        title : "Son " + this.fileName.toString(),
        sound: blob,
        duration: response.duration,
        projectId: this.projectId,
        audioId: audioId
      });
      this.fileName++;
      (this.$parent as any).close();
    }
  }

}



</script>


<template>
  <!-- Ensemble des composants -->

  <div class="TTS">
    <div class="wrapper main-component">


      <div class="right">
      <p class ="parametre">Créer une voix a partir d'un texte</p>
      </div>

      <div class="close"><i @click="$emit('close')" class="icon-close baku-button"></i></div>

      <!-- Zone de saisie du texte -->
      <textarea class="textTTS centered" placeholder="Taper le texte ici..." maxlength="32760" v-model="currentMsg"></textarea>

      <div class="centeredbisbis">
        <i class="icon-play"/>
        <p class ="ecouter" @click="listenAudio">Ecouter le texte </p>
      </div>


      <!-- Pitch et vitesse -->
      <div class="text-center wrapper">
        <div class='range_bar'>
          <input type="range" min="0" max="2" step="1" v-model="rate">
          <label class="ranges">Vitesse : {{rate}} </label>
        </div>
      </div>

      <div class="vitesse">
        <p>Lent</p>
        <p>Rapide</p>
      </div>

      <!-- Saisie de la voix -->
      <p class ="param">Sélectionner la voix souhaitée</p>
      <select class="voice-selector" v-model="voiceSelected">
        <option v-for="(voice, name) in voicesOptions" :value="voice"> {{name}} </option>
      </select>


      <!-- Boutons pour valider/annuler -->
      <div class="centeredbis">
        <button class="buttonTTS" @click="generateAudio"> Enregistrer la voix </button>
        <button class="buttonannuler" @click="$emit('close')"> Annuler </button>
      </div>

    </div>
  </div>
</template>


<style scoped>

  .TTS {
    justify-content: center;
    display: flex
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width:100%;
  }

  .close {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 4;
}

  .vitesse{
    display: flex;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    font-size: 15px;
    width:70%;
    margin-left : 5.1em;
    justify-content: space-between;
    margin-bottom : 3em;
    padding-top : 0em;
    margin-top:-1em;
    color:#c0bcbc;

  }

  .parametre {
    font-size: 25px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    text-align: left;
    font-weight: 900;
    padding: 10px 10px;
  }

  .main-component {
    width: 1500px;
    border: white;
    border-style: solid;
    padding: 10px;
    background: white;
    border-radius: 6px;
  }

  .param {
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    font-size: 20px;
    height: 10%;
    margin-top:-1em;
  }

  .ranges {
    padding-top: 0.5em;
    margin-right : 0.2em;
    font-size: 20px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    width:8em;
  }

  .textTTS {
    padding: 12px 20px;
    box-sizing: border-box;
    border: 2px solid #ccc;
    border-radius: 6px;
    border-color: #f5f5f5;
    background-color: #f5f5f5;
    font-size: 20px;
    width: 95%;
    height: 200px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
  }

  .icon-play {
    color: #ffbd72;
    font-family: 'baku' !important;
    speak: never;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 2;
    font-size: xx-large;
  }

  .ecouter {
    padding: 4px;
    text-align: center;
    color: #ffbd72;
    font-size: 25px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    cursor: pointer;
    margin: 12px;
  }

  .buttonTTS {
    background-color: #FE676F;
    padding: 5px 20px;
    text-align: center;
    color: white;
    border: 4px solid #FE676F;
    border-radius: 5px;
    font-size: 1.8rem;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    cursor: pointer;
    margin: 12px;
    width : 30%;
  }

  .buttonTTS:hover {
    background-color: #ff515a;
    color: white;
    border: 4px solid #ff515a;
  }

  .buttonannuler {
    background-color: #f5f5f5;
    padding: 5px 20px;
    text-align: center;
    color: #717171;
    border: 4px solid #f5f5f5;
    border-radius: 5px;
    font-size: 1.8rem;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    cursor: pointer;
    margin: 12px;
    text-align: right;
  }

  .buttonannuler:hover {
    background-color: #d9d6d6;
    color: #717171;
    border: 4px solid #d9d6d6;
  }

  label {
    width: fit-content;
  }

  .text-center {
    text-align: center;
  }

  .centered {
    display: flex;
    flex-direction: row-reverse;
    margin: 5px;
    justify-content: center;
  }

  .range_bar{
    display: flex;
    justify-content: center;
    width:80%;
    flex-direction: row-reverse;
  }

  .right {
    display: flex;
    justify-content: flex-start;
    width : 100%;
  }

  .centeredbis {
    display: flex;
    justify-content: flex-end;
    width : 100%;
    margin-top:1em;
  }

  .centeredbisbis {
    display: flex;
    justify-content: center;
    width : 100%;
    flex-direction: row;
  }

  .voice-selector {
    width: 15%;
    height: 10%;
    border-radius: 6px;
    justify-content: center;
    display: flex;
    font-size: 17px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    cursor: pointer;
    margin-bottom: 1em;
  }

  input[type=range] {
    -webkit-appearance: none;
    margin: 18px 0;
    width: 100%;
    cursor: pointer;
  }
  input[type=range]:focus {
    outline: none;
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 1.5em;
    cursor: pointer;
    background: #c0bcbc;
    border-radius: 5px;
  }
  input[type=range]::-webkit-slider-thumb {
    height: 30px;
    width: 12px;
    border-radius: 5px;
    background: #ffbd72;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -0.25em;
  }
  input[type=range]:focus::-webkit-slider-runnable-track {
    background: #c0bcbc;
  }
  input[type=range]::-moz-range-track {
    width: 100%;
    height: 1.5em;
    cursor: pointer;
    background: #c0bcbc;
    border-radius: 3px;
  }
  input[type=range]::-moz-range-thumb {
    height: 30px;
    width: 12px;
    border-radius: 5px;
    background: #ffbd72;
    cursor: pointer;
  }
  input[type=range]::-ms-track {
    width: 100%;
    height: 1.5em;
    cursor: pointer;
    background: transparent;
    color: transparent;
  }
  input[type=range]::-ms-fill-lower {
    background: #2a6495;
    border-radius: 2.6px;
  }
  input[type=range]::-ms-fill-upper {
    background: #c0bcbc;
    border-radius: 2.6px;
  }
  input[type=range]::-ms-thumb {
    height: 30px;
    width: 12px;
    border-radius: 5px;
    background: #ffbd72;
    cursor: pointer;
  }
  input[type=range]:focus::-ms-fill-lower {
    background: #c0bcbc;
  }
  input[type=range]:focus::-ms-fill-upper {
    background: #c0bcbc;
  }
</style>
