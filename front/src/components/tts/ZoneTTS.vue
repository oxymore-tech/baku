<script>

  import axios from 'axios';


  export default {
    name: "ZoneTTS.vue",
    data() { // Données du composant
      return {
        currentMsg: "",
        pitch: 50,
        rate: 100,
        projectId: this.$route.params.projectId,
        voiceSelected: null,
        fileName: 0,
        voicesOptions: {
          pierre: 'upmc-pierre-hsmm',
          jessica: 'upmc-jessica-hsmm',
          dennys: 'enst-dennys-hsmm',
          camille: 'enst-camille-hsmm'
        }
      }
    },

    methods:  {
      generateAudio() {
        if(this.currentMsg !== "") {
          console.log(this.currentMsg, this.voiceSelected, this.projectId);
          axios.post(`/api/${this.projectId}/saveWav`, {
            text: this.currentMsg,
            voice: this.voiceSelected,
            fileName: this.fileName,
          }).then(response => {
            console.log(response);
            this.fileName++;
            //TODO : utiliser la réponse
          }).catch(error => {
            console.log(error);
          })
          this.currentMsg = "";
        }
      },

      listenAudio() {

      },


    },


    mounted() {
      this.voiceSelected = this.voicesOptions[0];
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
          <input type="range" min="0" max="100" step="5" v-model="pitch">
          <label class="ranges">Ton : {{pitch}}</label>
        </div>
        <div class='centered'>
          <input type="range" min="0" max="200" step="10" v-model="rate">
          <label class="ranges">Vitesse : {{rate}} </label>
        </div>
      </div>

      <!-- Saisie de la voix -->
      <p class ="param">Sélection de la voix</p>
      <select class="voice-selector" v-model="voiceSelected">
        <option v-for="(voice, name) in voicesOptions" :value="voice"> {{name}} </option>
      </select>
      <span>Voice : {{voiceSelected}}</span>


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
  background-color: #d9cece;
  padding: 2px 10px;
  text-align: center;
  color: #455054;
  border: 2px solid white;
  border-radius: 16px;
  font-size: 1.8rem;
  font-family: "Montserrat", Helvetica, Arial, sans-serif;
  cursor: pointer;
  margin: 10px;
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

