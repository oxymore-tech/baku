<style lang="scss" scoped>
  @import "@/styles/audioEdit.scss"; 
</style>

<template>
  <div class="modal-card" style="width: 700px; height: 500px;">
    <header class="modal-card-head">
      <p class="modal-card-title">Modifier un son</p>
    </header>
    <section class="modal-card-body">
      <input type="text" ref="nameSound" :value="nameSound"/>
      <button class="button" id="PlayAction" type="button" @click="playAction()">Play</button>
      <button class="button" id="CropAction" type="button" @click="cropAndUpdate()">Crop</button>
      <div id="waveform"></div>
      <input id="volume" type="range" min="0" max="100" step="1" :value="audioVolume" @change="volumeAction()" ></input>

    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="closeAction();$parent.close()">Annuler</button>
      <button class="button is-primary" @click="storeEditedSound();closeAction();$parent.close()">Valider</button>
    </footer>
  </div>
</template>


<script lang="ts">
import {bufferToWave} from '@/utils/convert';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import WaveSurfer from "wavesurfer.js";
import WSRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';
const ProjectNS = namespace('project');
@Component

export default class EditSoundPopup extends Vue {
  @ProjectNS.Getter
  protected getAudioRecord!: any;
  @Prop()
  private id!: string;
  @Prop()
  private projectId!: string;
  public nameSound: string = "";
  public audioVolume: number = 100;
  private audioDuration: number = 0;
  private audioBlob: any;
  
  private waveSurfer: any;
  public async mounted(){
    const audio = this.getAudioRecord.find((audio: any) => audio.id === this.id);
    this.nameSound = audio.title;
    this.audioVolume = audio.volume;
    this.audioBlob = audio.sound;
    this.audioDuration = audio.duration;
    this.waveSurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        waveColor: '#ffbd72',
        progressColor: '#fe676f',
        cursorColor: '#fe676f',
        barWidth: 3,
        barRadius: 3,
        cursorWidth: 1,
        height: 200,
        barGap: 3,
        plugins: [
            WSRegions.create({
                regions: [
                    {
                        // id: 1,
                        // start: 0,
                        // end: 1,
                        // color: 'hsla(400, 100%, 30%, 0.5)'
                    },
                ],
                // dragSelection: {
                //     slop: 5
                // }
            })
        ]
    });
    this.waveSurfer.loadBlob(this.audioBlob);
    await this.waveSurfer.on('ready', () => {
      this.waveSurfer.addRegion({
                        id: 1,
                        start: 0,
                        end: this.waveSurfer.getDuration(),
                        color: 'hsla(32, 100%, 72%, 0.3)'
                    });
    });
    
    
    //this.waveSurfer.enableDragSelection();
  }
  public closeAction() {
    this.waveSurfer.clearRegions();
  }
  public playAction() {
    this.waveSurfer.regions.list["1"].play();
  }
  public async storeEditedSound(){
    var title: string = (this.$refs.nameSound as any).value;
    if(title == ""){
      title = this.nameSound;
    }
    this.audioDuration = this.waveSurfer.getDuration();
    await this.$store.dispatch('project/changeAudioTitle', { audioId: this.id, title });
    await this.$store.dispatch('project/changeAudioVolume', { audioId: this.id, volume: this.audioVolume });
    await this.$store.dispatch('project/changeAudioSound', { audioId: this.id, sound: this.audioBlob, projectId: this.projectId });
    await this.$store.dispatch('project/changeAudioDuration', { audioId: this.id, duration: this.audioDuration });
  }
  public volumeAction(){
    const volume: number = parseInt((<HTMLInputElement>document.getElementById("volume")).value);
      if(volume >= 0 && volume <= 100){
        this.waveSurfer.setVolume(volume/100);
        this.audioVolume = volume;
      }
  }
  public async cropAndUpdate(){
    this.audioBlob = this.crop();
    this.waveSurfer.clearRegions(); 
    this.waveSurfer.loadBlob(this.audioBlob);
    await this.waveSurfer.on('ready', () => {
      //console.log(this.waveSurfer.getDuration());
      this.waveSurfer.clearRegions();
      this.waveSurfer.addRegion({
                        id: 1,
                        start: 0,
                        end: this.waveSurfer.getDuration(),
                        color: 'hsla(400, 100%, 30%, 0.5)'
                    });
    });
  }
  private crop() {
    var start = this.waveSurfer.regions.list["1"].start;
    var end = this.waveSurfer.regions.list["1"].end;
    var originalAudioBuffer = this.waveSurfer.backend.buffer;
    var lengthInSamples = Math.floor( (end - start) * originalAudioBuffer.sampleRate )+1;
    if (! window.OfflineAudioContext) {
        if (! window.OfflineAudioContext) {
            alert('webkit context not found')
        }
        window.OfflineAudioContext = window.OfflineAudioContext;
    }
    // var offlineAudioContext = new OfflineAudioContext(1, 2,originalAudioBuffer.sampleRate );
    var offlineAudioContext = this.waveSurfer.backend.ac
    var emptySegment = offlineAudioContext.createBuffer(
        originalAudioBuffer.numberOfChannels,
        lengthInSamples,
        originalAudioBuffer.sampleRate );
    // var newAudioBuffer = offlineAudioContext.createBuffer(
    //     originalAudioBuffer.numberOfChannels,
    //     (start === 0 ? (originalAudioBuffer.length - emptySegment.length)+1 :originalAudioBuffer.length),
    //     originalAudioBuffer.sampleRate);
    for (var channel = 0; channel < originalAudioBuffer.numberOfChannels;channel++) {
        // var new_channel_data = newAudioBuffer.getChannelData(channel);
        var empty_segment_data = emptySegment.getChannelData(channel);
        var original_channel_data = originalAudioBuffer.getChannelData(channel);
        // var before_data = original_channel_data.subarray(0, start * originalAudioBuffer.sampleRate);
        var mid_data = original_channel_data.subarray( start * originalAudioBuffer.sampleRate, end * originalAudioBuffer.sampleRate);
        // var after_data = original_channel_data.subarray(Math.floor(end * originalAudioBuffer.sampleRate), (originalAudioBuffer.length * originalAudioBuffer.sampleRate));
        // console.log(after_data);
        // console.log(new_channel_data);
        empty_segment_data.set(mid_data);
        // if(start > 0){
        //     new_channel_data.set(before_data);
        //     new_channel_data.set(after_data,(start * newAudioBuffer.sampleRate));
        // } else {
        //     new_channel_data.set(after_data);
        // }
    }
    return bufferToWave(emptySegment,0,lengthInSamples)
  }
}
</script>