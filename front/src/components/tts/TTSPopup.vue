<script lang="ts">
import { Component,Prop,Vue } from 'vue-property-decorator';
import * as api from '@/api';

@Component
export default class RecordPopup extends Vue {

  @Prop()
  public projectId! : string;

  //previewCreated: false,
  public currentMsg: string ="";
  public pitch: number = 50;
  public rate: number = 1;
  public voiceSelected: any = null;
  public fileName: number = 0;
  public voicesOptions: any = null;
  public async mounted() {
    this.voicesOptions =  {
      Pierre: 'upmc-pierre-hsmm',
      Jessica: 'upmc-jessica-hsmm',
      Dennys: 'enst-dennys-hsmm',
      Camille: 'enst-camille-hsmm'
    }
    this.voiceSelected = this.voicesOptions.Pierre;
  }

  public listenAudio() {
    if (this.currentMsg !== "") {
      api.listenWav(this.projectId, this.currentMsg, this.voiceSelected);
    }
  }

  public generateAudio() {
    if (this.currentMsg !== "") {
      api.generateWav(this.projectId, this.currentMsg, this.voiceSelected, this.fileName.toString());
      this.fileName++;
      this.currentMsg = "";
    }
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

      <!-- Zone de saisie du texte -->
      <textarea class="textTTS centered" placeholder="Taper le texte ici..." maxlength="32760" v-model="currentMsg"></textarea>
      
      <div class="centeredbisbis">
        <i class="icon-play":class="{'baku-button primary-button': isPlaying !== 'selection', 'disabled-button': isPlaying === 'selection'}"/>
        <p class ="ecouter">Ecouter le texte </p>
      </div>


      <!-- Pitch et vitesse -->
      <div class="text-center wrapper">
        <div class='range_bar'>
          <input type="range" min="0" max="2" step="1" v-model="rate">
          <label class="ranges">Vitesse </label>
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
        <button class="buttonannuler"> Annuler </button>    
      </div>

      
      <!-- TODO Ecouter réellememnt l'audio
      <div class="wrapper centered">
        <figure>
          <audio controls v-if="previewCreated === true"></audio>
        </figure>
      </div>
      -->

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

  .vitesse{
    display: flex;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    font-size: 15px;
    width:70%;
    margin-left : 5em;
    justify-content: space-between;
    margin-bottom : 3em;
    padding-top : 0em;
    margin-top:-1em;
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
  }

  .ranges {
    padding-top: 0.5em;
    padding-right : 0.5em;
    font-size: 20px;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
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
