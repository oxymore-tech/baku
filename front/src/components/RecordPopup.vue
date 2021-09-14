<template>
  <div class="modal-card" style="width: 700px; height: 500px;">
    <header class="modal-card-head">
      <p class="modal-card-title">Capturer un son</p>
    </header>
    <section class="modal-card-body">
      <b-field v-if="selectedDeviceId">
        <b-select
          :loading="!devices.length"
          v-model="selectedDeviceId"
          placeholder="Sélectionner un microphone"
        >
        <option v-for="device in devices" :key="device.id" :value="device.id">{{device.label}}</option>
        </b-select>
      </b-field>
      <p v-else style="color:red;font-size:14px;">Veuillez autoriser l'accès à votre microphone.</p>
      <input type="text" ref="nameSound" :value="nameSound"/>
      
      <button class="button" id="StartRecordAction" type="button" @click="startRecordAction()">Record</button>
      <button class="button" id="StopRecordAction" style="display:none;" type="button" @click="stopRecordAction()">Stop</button>
      <br><button class="button" id="PlayAction" style="display:none;" type="button" @click="playAction()">Play</button>
      <div id="waveform"></div>
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="closeMedia()">Annuler</button>
      <button class="button is-primary" id="RecordAction" style="display:none;" @click="closeMedia();storeSound()">Valider</button>
    </footer>
  </div>
</template>


<script lang="ts">
import {bufferToWave} from '@/utils/convert';
import { Component,Prop,Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import WaveSurfer from "wavesurfer.js";

export class AudioDevice{
  public id: string;
  public label: string;

  constructor(input: MediaDeviceInfo) {
    this.id = input.deviceId;
    this.label = input.label;
  }
}

const ProjectNS = namespace('project');

@Component
export default class RecordPopup extends Vue {

  @ProjectNS.Getter
  protected getAudioRecord!: any;

  @Prop()
  public projectId! : string;

  private numberOfSounds: number = 0;
  public nameSound: string = "";

  public devices: AudioDevice[] = [];

  public selectedDeviceId: string = "";
  
  private isRecording: boolean = false;

  private stream: any;

  private mediaRecorder: any;

  
  audioChunks = Array();

  private waveSurfer: any;

  private audioBlob: any;
  private audioImage: any;
  private audioDuration: any;

  public async mounted() {
    this.numberOfSounds = this.getAudioRecord.length + 1;
    this.nameSound = "Son " + this.numberOfSounds.toString();

    this.stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const devices = (await navigator.mediaDevices.enumerateDevices()) || [];

    const audioDevices = devices
      .filter(
        (input: MediaDeviceInfo) => input.kind === 'audioinput' && input.deviceId !== '',
      );
    this.devices = audioDevices.map((input: MediaDeviceInfo) => new AudioDevice(input));
    
    this.selectedDeviceId = this.devices[0].id ?? undefined;
    this.waveSurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        waveColor: '#ffbd72',
        progressColor: '#fe676f',
        cursorColor: '#fe676f',
        barWidth: 3,
        barRadius: 3,
        cursorWidth: 1,
        height: 200,
        barGap: 3
    });
    
  }

  public async startRecordAction() {
    let el: HTMLElement | null = document.getElementById("StartRecordAction");
    if(el){
      el.style.display = 'none';
    }
    el = document.getElementById("StopRecordAction");
    if(el){
      el.style.display = 'inline';
    }
    el = document.getElementById("PlayAction");
    if(el){
      el.style.display = 'none';
    }
    this.isRecording = true;
    this.audioChunks = Array();

    this.stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: this.selectedDeviceId}});
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.start(1); // pass optionnal timeslice in ms as parameter
    this.mediaRecorder.addEventListener("dataavailable", (event: any) => {
    this.audioChunks.push(event.data);
    });
  }

  public async stopRecordAction() {
    let el: HTMLElement | null = document.getElementById("StartRecordAction");
    if(el){
      el.style.display = 'inline';
    }
    el = document.getElementById("StopRecordAction");
    if(el){
      el.style.display = 'none';
    }
    el = document.getElementById("PlayAction");
    if(el){
      el.style.display = 'inline';
    }
    el = document.getElementById("RecordAction");
    if(el){
      el.style.display = 'inline';
    }
    this.isRecording = false;

    this.mediaRecorder.stop();
    this.stream.getTracks().forEach(function(track: MediaStreamTrack) {
      track.stop();
    });
    this.mediaRecorder.addEventListener("stop", async () => {
    this.audioBlob = new Blob(this.audioChunks);
    this.waveSurfer.loadBlob(this.audioBlob);
    this.waveSurfer.on('ready', async (e: any) => {
      setTimeout(async () => {
        this.audioDuration = this.waveSurfer.getDuration();
        this.audioImage = await this.waveSurfer.exportImage('image/png', 1);
        let el: HTMLImageElement | null = (<HTMLImageElement>document.getElementById("img"));
        if (el){
          el.src = this.audioImage;
        }
      }, 300);
    });
    });
  }
  
  public playAction(){
    if(!this.isRecording){
      this.waveSurfer.play();
    };
  }

  public async closeMedia(){
    if(this.isRecording){
      await this.mediaRecorder.stop();
      this.stream.getTracks().forEach(function(track: MediaStreamTrack) {
        track.stop();
      });
    }
    if(this.waveSurfer.isPlaying()){
      await this.waveSurfer.stop();
    }
    (this.$parent as any).close();
  }

  public async storeSound(){
    if(this.audioBlob != undefined){
      var title: string = (this.$refs.nameSound as any).value;
      if(title == ""){
        title = this.nameSound;
      }
      let originalAudioBuffer = this.waveSurfer.backend.buffer;
      let lengthInSamples = Math.floor(this.waveSurfer.getDuration() * originalAudioBuffer.sampleRate);
      this.audioBlob = bufferToWave(originalAudioBuffer,0,lengthInSamples);
      await this.$store.dispatch('project/createAudio', { title, sound: this.audioBlob, duration: this.audioDuration, projectId : this.projectId});
    }
  }
}
</script>