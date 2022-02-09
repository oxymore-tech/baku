<script>
import { SpeechSynthesisUtterance, SpeechSynthesis } from 'speech-synthesis';


export default {
  name: "ZoneTTS.vue",
  data() { // Données du composant
    return {
      currentMsg: "",
      pitch: null,
      rate: null,
      voiceSelected: null
    }
  },

  methods:  {
    generateAudio() {
      if(this.currentMsg !== "") {
        // TODO
        this.currentMsg = "";
      }
    },

    listenAudio() {
      if(this.currentMsg !== "") {
        // TODO
      }
    }
  }

}
</script>



<template>
  <!-- Ensemble des composants -->

  <div class="TTS">
    <div class="wrapper main-component">

  <!-- Zone de saisie du texte -->
      <textarea class="textTTS centered" placeholder="Insérez votre texte ici..." maxlength="32760" v-model="currentMsg"></textarea>


  <!-- Pitch et vitesse -->
      <div class="text-center wrapper">
        <p class="param">Paramètres audio</p>
        <div class='centered'>
            <input type="range" min="0" max="2" step="0.1" v-model="pitch">
            <label class="ranges" for="volume">Ton : {{pitch}}</label>
        </div>
        <div class='centered'>
            <input type="range" min="0.1" max="10" step="0.1" v-model="rate">
            <label class="ranges" for="volume">Vitesse : {{rate}} </label>
        </div>
      </div>

  <!-- Saisie de la voix -->
      <select class="voice-selector" v-model="voiceSelected"></select>

  <!-- Boutons pour valider -->
      <div class="wrapper centered">
        <button class="buttonTTS" v-on:click="listenAudio"> Ecouter l'audio </button>
        <button class="buttonTTS" v-on:click="generateAudio"> Enregistrer l'audio </button>
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
    margin: 10px;
  }

  .main-component {
    width: 600px;
    border: #ffbd72;
    border-style: solid;
    padding: 10px;
    background: #ffebd3;
    border-radius: 16px;
  }

  .param {
    font-size: 16px;
  }

  .ranges {
    font-size: 13px;
  }

  .textTTS {
    padding: 12px 20px;
    box-sizing: border-box;
    border: 2px solid #ccc;
    border-radius: 16px;
    border-color: black;
    background-color: #ffffff;
    font-size: 16px;
    width: 80%;
    height: 175px;
  }

  .buttonTTS {
    background-color: d9cece;
    padding: 2px 10px;
    text-align: center;
    color: #455054;
    border: 2px solid white;
    border-radius: 16px;
    font-size: 1.8rem;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    cursor: pointer;
    margin: 10px;
    border-style: solid;
    border: #bfb4ac
  }

  .buttonTTS:hover {
    background-color: #dcdcdc;
    color: black;
  }

  label {
      font: 1rem 'Fira Sans', sans-serif;
      width: 75px;
  }

  .text-center {
      text-align: center;
  }

  .centered {
      display: flex;
      flex-direction: row-reverse;
      margin: 5px;
      justify-content:center
  }

  .voice-selector {
    width: 50%;
    height: 30px;
    border-radius: 16px;
  }

  input[type=range] {
    -webkit-appearance: none;
    margin: 18px 0;
    width: 100%;
  }
  input[type=range]:focus {
    outline: none;
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 8.4px;
    cursor: pointer;
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    background: #7f7f7f;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
  }
  input[type=range]::-webkit-slider-thumb {
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    border: 1px solid #000000;
    height: 36px;
    width: 16px;
    border-radius: 3px;
    background: #ffbd72;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -14px;
  }
  input[type=range]:focus::-webkit-slider-runnable-track {
    background: #7f7f7f;
  }
  input[type=range]::-moz-range-track {
    width: 100%;
    height: 8.4px;
    cursor: pointer;
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    background: #7f7f7f;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
  }
  input[type=range]::-moz-range-thumb {
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    border: 1px solid #000000;
    height: 36px;
    width: 16px;
    border-radius: 3px;
    background: #ffbd72;
    cursor: pointer;
  }
  input[type=range]::-ms-track {
    width: 100%;
    height: 8.4px;
    cursor: pointer;
    background: transparent;
    border-color: transparent;
    border-width: 16px 0;
    color: transparent;
  }
  input[type=range]::-ms-fill-lower {
    background: #2a6495;
    border: 0.2px solid #010101;
    border-radius: 2.6px;
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  }
  input[type=range]::-ms-fill-upper {
    background: #7f7f7f;
    border: 0.2px solid #010101;
    border-radius: 2.6px;
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  }
  input[type=range]::-ms-thumb {
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    border: 1px solid #000000;
    height: 36px;
    width: 16px;
    border-radius: 3px;
    background: #ffbd72;
    cursor: pointer;
  }
  input[type=range]:focus::-ms-fill-lower {
    background: #7f7f7f;
  }
  input[type=range]:focus::-ms-fill-upper {
    background: #7f7f7f;
  }


</style>

