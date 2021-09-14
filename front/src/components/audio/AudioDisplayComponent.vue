<style lang="scss" scoped>
@import "@/styles/audioDisplay.scss";
</style>


<template>
  <div
    class="audioDisplay-root-div"
    dropzone=true
    @dragover="allowDrop($event);"
    @drop="handleDrop($event);"
  >

    <div class="horizontal-align">
      <div class="padding-button">
        <i class="button is-primary" @click="backward10">Reculer de 10</i>
      </div>

      <div class="padding-button">
        <i class="button is-primary" @click="backward1">Reculer de 1</i>
      </div>

      <div class="padding-button">
        <i class="button is-primary" @click="forward1">Avancer de 1</i>
      </div>

      <div class="padding-button">
        <i class="button is-primary" @click="forward10">Avancer de 10</i>
      </div>

      <div class="padding-button">
        <i class="button is-primary" @click="deleteAudioSegment">Supprimer un son</i>
      </div>

      <div class="padding-button">
          Mode : {{ this.mode }}
      </div>

      <div class="padding-button">
        <i class="button is-primary" @click="addPiste()">Ajouter une piste</i>
      </div>

      <b-dropdown
        class="toolbox-dropdown"
        append-to-body
        aria-role="menu"
      >
        <a class="navbar-item" slot="trigger" role="button" slot-scope="{ active }" style="display: flex; align-items: center">
          <span class="item-title">Piste {{activePiste}} </span>
          <i class="icon-chevron-right" :class="active ? 'menu-down' : 'menu-up'"></i>
        </a>


        <div v-for="index in listPistes">

          <b-dropdown-item class aria-role="listitem">
            <div class="option-logo" @click="goToPiste(index)">
              <span>Piste {{index}} </span>
            </div>
          </b-dropdown-item>

        </div>


      </b-dropdown>

      <div class="padding-button">
        <i class="button is-primary" @click="removePiste(activePiste)">Supprimer la piste</i>
      </div>

    </div>

    <div ref="movieContainer" class="movie-container">

    </div>

  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Movie } from '@/utils/movie.service';
import TimelinesChart from 'timelines-chart';
import { Shot } from '@/utils/movie.service';
//import { clone } from 'lodash';


const ProjectNS = namespace('project');

@Component
export default class AudioDisplayComponent extends Vue {

    @Prop()
    public isPlaying: 'animation' | 'selection' | null = null;

    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    protected movie!: Movie;

    @ProjectNS.Getter
    protected getAudioRecord!: any;

    @ProjectNS.Getter
    protected getSoundTimeline!: any;

    @ProjectNS.Getter
    protected getMovieFps !: any;

    private chart: any = TimelinesChart();

    private chartData!: any;

    public allShots: Array<any> = [];

    private audioRecord: Array<any> = [];

    private goForward10 : boolean = true;
    private goForward1 : boolean = false;
    private goBackward1 : boolean = false;
    private goBackward10 : boolean = false;
    private deleteSound : boolean = false;
    public mode : string = "Avancer de 10 frames";
    private nbTotalFrames : number = 0;
    private nbPistes : number = 1;
    private activePiste : number = 1;
    private listPistes : number[] = [1];



    async mounted() {
      await this.$store.dispatch('project/loadProject', this.$route.params.projectId); 
      this.initializeChart();
            
      window.addEventListener('resize', this.reportWindowSize);
      this.chart.data(this.chartData)
            .xTickFormat((n: number): number => +n)
            .timeFormat('%Q')
            .maxHeight(window.innerHeight*0.256-1.136)
            .onSegmentClick(this.segmentClick)
            .maxLineHeight(70)
            .zQualitative(true)
            .dateMarker(1)
            .enableAnimations(false)
            .segmentTooltipContent(this.segmentTooltip);
      this.chart(this.$refs.movieContainer);
      this.audioRecord = this.getAudioRecord;

    }

    reportWindowSize() {
      const height = Math.round(window.innerHeight*0.256-1.136);
      this.chart.maxHeight(height)
                .refresh();
    }

    getChart(){
      return [
          {
            group: "SONS",
            data: [
              {
                label: "Piste 1",
                data: []
              },
            ],
          },
          {
            group: "PLANS",
            data: [
              {
                label: "",
                data: this.getChartFromShots(),
              },
            ],
          },
        ];
    }

    public initializeChart(){
      let localChart = this.chartData;
      if (!localChart) {
        localChart = this.getChart();        

      for (let sound of this.getSoundTimeline) {
        if(!localChart[0].data[sound.pisteNumber-1]) {

          // ajouter un nombre de pistes suffisant
          let pisteLength = localChart[0].data.length;
          for(let i = 1; i<=(sound.pisteNumber-pisteLength); i++){
            let numPiste = localChart[0].data.length + 1;
            this.nbPistes = this.nbPistes +1;

            let pistes = [... localChart[0].data];
            this.listPistes.push(numPiste);

            pistes.push({
              label : "Piste " + numPiste,
              data : [],
            });
            localChart[0].data = pistes;
          }
        }

        let timeRange = [sound.start, sound.end];
        let dataActivePiste = [... localChart[0].data[sound.pisteNumber-1].data];
        let dataSound = {
            timeRange : timeRange,
            val : sound.title,
            audioId : sound.audioId,
            soundTimelineId : sound.id,
        };
        dataActivePiste.push(dataSound);
        localChart[0].data[sound.pisteNumber-1].data = dataActivePiste;

      }
      }
      this.chartData = localChart;
    }

    public actualizeDateMarker(newFrame: number){
      this.chart.dateMarker(newFrame);
    }

    public setAllShots(shots: Shot[]){
      this.allShots = shots;
      for (let shot of this.allShots) {
        this.nbTotalFrames = this.nbTotalFrames + shot.images.length;
      }
      let updatedData = [...this.chartData];
      updatedData[1].data = [
              {
                label: "",
                data: this.getChartFromShots(),
              },
            ];
      updatedData = JSON.parse(JSON.stringify(updatedData));
      this.chart.data(updatedData);
      this.chartData = updatedData;
    }

    getChartFromShots(){
      if(this.allShots){
        const nSegments = this.allShots.length
        let runLength = 1;

        return [...Array(nSegments).keys()].map(i => {
          const start = runLength,
            end = runLength + this.allShots[i].images.length;

          runLength = end;

          return {
            timeRange: [start, end],
            val: `Plan ${i+1}`
          };
        });
      } else {
        return [];
      }
    }


    segmentTooltip(d : any) {
      return d.labelVal+'<br>'
            + "From : " + (Math.round(d.data.timeRange[0])) + '<br>'
            + "To : "  + (Math.round(d.data.timeRange[1]));
    }

    public async segmentClick(segment : any) {
      if (!this.isPlaying) {
        if (this.goBackward1 || this.goBackward10 || this.goForward1 || this.goForward10) {
          let updatedStartEnd = this.moveSound(segment);
          let soundTimelineId = segment.target.__data__.data.soundTimelineId;
          await this.$store.dispatch('project/updateSoundTimelineStart', { soundTimelineId, start : updatedStartEnd[0], end : updatedStartEnd[1] });
        }
        if (this.deleteSound) {
          let soundTimelineId = segment.target.__data__.data.soundTimelineId;
          let pisteNumber = segment.target.__data__.label.split(" ")[1] - 1;
          this.removeSoundTimeline(soundTimelineId, pisteNumber);
          if (this.chartData[0].data[pisteNumber].data.length == 0 && this.chartData[0].data.length > 1) {
            this.removePiste(pisteNumber+1);
          }
        }

        this.chart.data(this.chart.data());
        this.chartData = this.chart.data();
        this.chart.refresh();
      }
    }

  moveSound(segment : any) {
    let nbFrames = 0;

    let piste = segment.target.__data__.label.split(" ")[1] - 1;
    let start = segment.target.__data__.data.timeRange[0];
    let end = segment.target.__data__.data.timeRange[1];

    if (this.goForward1 || this.goForward10) {
      if (this.goForward1) {
        nbFrames = 1;
      } else {
        nbFrames = 10;
      }

      let moveAllowed = this.checkSound(start + nbFrames, end + nbFrames, piste, [start, end]);

      if (moveAllowed && !this.isPlaying) {
        if (start + nbFrames >= this.nbTotalFrames) {
            segment.target.__data__.data.timeRange[1] = end - start + this.nbTotalFrames + 1;
            segment.target.__data__.data.timeRange[0] = this.nbTotalFrames + 1;
        } else {
            segment.target.__data__.data.timeRange[0] = start + nbFrames;
            segment.target.__data__.data.timeRange[1] = end + nbFrames;
        }
      }
    } else {
      if (this.goBackward1) {
        nbFrames = 1;
      } else if (this.goBackward10) {
        nbFrames = 10;
      }

      let moveAllowed = this.checkSound(start - nbFrames, end - nbFrames, piste, [start, end]);

      if (moveAllowed && !this.isPlaying) {
        if (start - nbFrames <= 0) {
          segment.target.__data__.data.timeRange[1] = end - start + 1;
          segment.target.__data__.data.timeRange[0] = 1;
        } else {
          segment.target.__data__.data.timeRange[0] = start - nbFrames;
          segment.target.__data__.data.timeRange[1] = end - nbFrames;
        }
      }
    }

    return [segment.target.__data__.data.timeRange[0], segment.target.__data__.data.timeRange[1]];
  }

  public async removeSoundTimeline(soundTimelineId : string, pisteNumber : number) {
    if(!this.isPlaying) {
      await this.$store.dispatch('project/removeSoundTimeline', soundTimelineId);
      let updatedData = [... this.chart.data()];
      const index = updatedData[0].data[pisteNumber].data.findIndex((p : any) => p.soundTimelineId === soundTimelineId);
      updatedData = JSON.parse(JSON.stringify(updatedData));
      updatedData[0].data[pisteNumber].data.splice(index,1);

      this.chart.data(updatedData);
      this.chartData = updatedData;
    }
  }

  renamePistes(updatedData : any) : any {
    for (let i = 1; i<=updatedData[0].data.length; i++) {
      updatedData[0].data[i-1].label = "Piste " + i;
      this.listPistes[i-1] = i;
    }
    return updatedData;
  }

  backward10() {
    this.setFalse();
    this.goBackward10 = true;
    this.mode = "Reculer de 10 frames";
  }

  backward1() {
    this.setFalse();
    this.goBackward1 = true;
    this.mode = "Reculer de 1 frame";
  }

  forward1() {
    this.setFalse();
    this.goForward1 = true;
    this.mode = "Avancer de 1 frame";
  }

  forward10() {
    this.setFalse();
    this.goForward10 = true;
    this.mode = "Avancer de 10 frames";
  }

  deleteAudioSegment() {
    this.setFalse();
    this.deleteSound = true;
    this.mode = "Supprimer un son";
  }

  setFalse() {
    this.goBackward1 = false;
    this.goBackward10 = false;
    this.goForward1 = false;
    this.goForward10 = false;
    this.deleteSound = false;
  }

  public async whenCrop(audioId : string, duration : number) {
    let nbFrames = Math.round(duration*this.getMovieFps);

    let pistes = [... this.chartData[0].data];

    for (let i = 0; i < pistes.length; i++) {
      for (let j = 0; j < pistes[i].data.length; j++) {
        let sound = pistes[i].data[j];
        if (sound.audioId == audioId) {
          let end = sound.timeRange[0] + nbFrames;
          pistes[i].data[j].timeRange[1] = end;
          await this.$store.dispatch('project/updateSoundTimelineStart', {soundTimelineId : sound.soundTimelineId , start : sound.timeRange[0], end}); 
        }
      }
    }

    let newChartData =  JSON.parse(JSON.stringify(this.chartData));
    newChartData[0].data = pistes;
    this.chart.data(newChartData);
    this.chartData = newChartData;
  }


  @Watch('getAudioRecord')
  public async onSoundChange(newAudioRecord : Array<any>) {
    if (this.audioRecord.length == newAudioRecord.length) {
      for (let i = 0; i < newAudioRecord.length; i++) {
        if (this.audioRecord[i].duration != newAudioRecord[i].duration) {
          this.whenCrop(newAudioRecord[i].id, newAudioRecord[i].duration);
        }
      }
    } else if (this.audioRecord.length == (newAudioRecord.length+1) ) {
      let audio = this.audioRecord.filter((v) => {
                      return !newAudioRecord.includes(v);
                  })[0];
      let soundTimeline = this.getSoundTimeline;
      soundTimeline.forEach((elt:any) => {
        if (elt.audioId == audio.id) {
          this.removeSoundTimeline(elt.id, elt.pisteNumber-1);
        }
      });
      let updatedData = [... this.chart.data()];
      for (let i = updatedData[0].data.length; i>0; i--) {
        if (updatedData[0].data[i-1].data.length == 0 && updatedData[0].data.length > 1) {
          this.removePiste(i);
        }
      }
      updatedData = JSON.parse(JSON.stringify(updatedData));
      this.chart.data(updatedData);
      this.chartData = updatedData;
    }
    this.audioRecord = newAudioRecord;
  }


  @Watch('getMovieFps')
  public async onFpsChange(movieFps : number) {
    let soundsTimeline = this.getSoundTimeline;
    let audios = this.getAudioRecord;
    soundsTimeline.forEach(async (elt : any) => {
      const audio = audios.find((p : any) => p.id === elt.audioId);
      let duration = Math.round(audio.duration*movieFps);
      let end = elt.start + duration;
      await this.$store.dispatch('project/updateSoundTimelineStart', {soundTimelineId : elt.id, start : elt.start, end});
    });

    this.initializeChart();
    let updatedData = [...this.chartData];
    for (let i = 0; i < updatedData[0].data.length; i++) {
      for (let j = 0; j < updatedData[0].data[i].data.length; j++) {
        const audio = audios.find((p : any) => p.id === updatedData[0].data[i].data[j].audioId);
        let start = updatedData[0].data[i].data[j].timeRange[0];
        let duration = Math.round(audio.duration*movieFps);
        updatedData[0].data[i].data[j].timeRange = [start, start+duration];
      }
    }

    updatedData = JSON.parse(JSON.stringify(updatedData));
    this.chart.data(updatedData);
    this.chartData = updatedData;
    this.chart.refresh();
  }

  // Drop from the Record sounds list

  allowDrop(event: any) {
    event.preventDefault();
  }

  public async handleDrop(event: any) {
    event.preventDefault();
    let audioId = event.dataTransfer.getData("text");
    let audios = this.getAudioRecord;
    const audio = audios.find((p : any) => p.id === audioId);
    let title = audio.title;
    let start = this.chart.dateMarker();
    let duration = Math.round(audio.duration*this.getMovieFps);
    let end = start + duration;

    let addAllowed = this.checkSound(start, end, this.activePiste-1, [-1, -1]);

    if (addAllowed && !this.isPlaying) {
      const soundTimelineId = await this.$store.dispatch('project/createSoundTimeline', {audioId, start, end, pisteNumber : this.activePiste, title});

      this.addAudioToPiste(audioId, title, soundTimelineId, this.activePiste, start, end);
    }


    event.dataTransfer.clearData();
  }

  checkSound(start : number, end : number, piste : number, timeRange: number[]) {
    let dataChart = this.chart.data();

    for (let i = 0; i < dataChart[0].data[piste].data.length; i++) {
      let sound = dataChart[0].data[piste].data[i];

      if (sound.timeRange[0] != timeRange[0] || sound.timeRange[1] != timeRange[1]) {
        if (!(start >= sound.timeRange[1] || end <= sound.timeRange[0])) {
          return false;
        }
      }
      
    }
    return true;
  }

  addAudioToPiste (audioId : string, title : string, soundTimelineId : string, numPiste : number, start : number, end : number) {
    let timeRange = [start, end];
    let dataActivePiste = [... this.chartData[0].data[this.activePiste-1].data];
    let dataSound = {
        timeRange : timeRange,
        val : title,
        audioId : audioId,
        soundTimelineId : soundTimelineId,
    };
    dataActivePiste.push(dataSound);
    let newChartData =  JSON.parse(JSON.stringify(this.chartData));
    newChartData[0].data[this.activePiste-1].data = dataActivePiste;
    this.chart.data(newChartData);
    this.chartData = newChartData;
  }


  public async addPiste() {
    let numPiste = this.nbPistes + 1;
    this.nbPistes = this.nbPistes +1;

    let pistes = [... this.chartData[0].data];
    this.listPistes.push(numPiste);
    pistes.push({
      label : "Piste " + numPiste,
      data : [],
    });
    let newChartData =  JSON.parse(JSON.stringify(this.chartData));
    newChartData[0].data = pistes;
    this.chart.data(newChartData);
    this.chartData = newChartData;
    this.activePiste = numPiste;
  }


  public async removePiste(pisteNumber : number) {

    let newDataUpdate = [... this.chart.data()];
    newDataUpdate = JSON.parse(JSON.stringify(newDataUpdate));

    if (newDataUpdate[0].data.length > 1) {

      newDataUpdate[0].data.splice(pisteNumber-1, 1);
      this.listPistes.splice(pisteNumber-1 , 1);

      newDataUpdate = this.renamePistes(newDataUpdate);
      this.nbPistes = this.nbPistes - 1;

      if (pisteNumber>= this.activePiste && pisteNumber!=1 && this.activePiste!=1) {
        this.activePiste = this.activePiste - 1;
      }
    
      this.chart.data(newDataUpdate);
      this.chartData = newDataUpdate;
    }
    
  }

  goToPiste(n : number) {
    this.activePiste = n;
  }
}
</script>