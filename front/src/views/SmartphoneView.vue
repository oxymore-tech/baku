<template>
  <div>
    <!-- <SmartphoneLocalVideoComponent v-if="isConnected" /> -->
   <h1>QR Reader Page</h1>

    <video
      id="localVideo"
      autoplay
      playsinline
      width="1920"
      height="1080"
    ></video>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { State, namespace } from 'vuex-class';
// import SmartphoneLocalVideoComponent from '@/components/smartphone/SmartphoneLocalVideoComponent.vue';
import QrReaderComponent from '@/components/smartphone/QrReaderComponent.vue';
import store from '@/store';
import { Device } from '@/api/device.class';
import { WSSocket } from '@/api/socket.class';

import { SocketStatus } from '../store/store.types';

const WebrtcNS = namespace('webrtc');

@Component({
  components: {
    // SmartphoneLocalVideoComponent,
    QrReaderComponent,
  },
  store,
})
export default class SmartphoneView extends Vue {
  @State
  public isConnected!: boolean;

  @WebrtcNS.State
  private socketStatus!: SocketStatus;

  public socketId!: string;

  public socket = new WSSocket();

  public localVideo: any;

  public error = '';

  public peerConnection!: RTCPeerConnection;

  private device = new Device('smartphone', 'Smartphone');

  public created() {
    const { socketId } = this.$route.params;
    this.socketId = socketId;
  }

  @Watch('socketStatus')
  public onSocketStatusChanged() {
    if (this.socketStatus !== 'opened') {
      this.socket.sendWSMessage({ action: 'link', value: this.socketId });
    }
  }

  public mounted() {
    this.socket.messageListenerFunction = (message) => {
      switch (message.action) {
        case 'rtcOffer':
          this.startStream(message.value);
          break;
        case 'icecandidate':
          if (message.value) {
            this.peerConnection.addIceCandidate(message.value);
          }
          break;
        default:
          this.startStream(message.value);
      }
    };
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    this.peerConnection.addEventListener(
      'icecandidate',
      this.onIceCandidate.bind(this),
    );

    this.peerConnection.onconnectionstatechange = (_event) => {
      if (this.peerConnection.connectionState === 'connected') {
        // CONNECTION OK
        console.log('CONNECTION OK');
        this.$store.commit('webrtc/setupConnection');
      }
      console.log(this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'disconnected') {
        delete this.peerConnection;
        this.localVideo.srcObject
          .getTracks()
          .forEach((track: MediaStreamTrack) => {
            track.stop();
          });
      }
    };
  }

  private async startStream(remoteOffer: any) {
    this.localVideo = document.getElementById('localVideo');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1280, ideal: 1920 },
        height: { min: 720, ideal: 1080 },
        facingMode: {
          exact: 'environment',
        },
      },
    });
    console.log('Received local stream');
    this.localVideo.srcObject = stream;

    this.peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setChannelEvents(dataChannel);
    };

    stream
      .getVideoTracks()
      .forEach((track) => this.peerConnection.addTrack(track, stream));
    try {
      console.log('remoteOffer', remoteOffer, this.peerConnection);
      await this.peerConnection.setRemoteDescription(remoteOffer);
    } catch (e) {
      console.error('Failed to set remote description', e);
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.sendWSMessage({ action: 'rtcAnswer', value: answer });
    } catch (e) {
      console.error('Failed sending answer', e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    // eslint-disable-next-line no-param-reassign
    channel.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'cmd') {
        this.device.capture(
          'localVideo',
          { scaleX: data.scaleX, scaleY: data.scaleY },
          data.projectId,
          (id) => channel.send(
            JSON.stringify({
              type: 'capture',
              message: { id },
            }),
          ),
          (id) => channel.send(
            JSON.stringify({
              type: 'upload',
              message: id,
            }),
          ),
          (e) => console.error('Unable to capture', e),
        );
      }
    };
    // eslint-disable-next-line no-param-reassign
    channel.onopen = () => {
      const channelpush = channel.send;
      // eslint-disable-next-line no-param-reassign
      channel.send = (data: any) => {
        console.log('Sending message: ', data);
        channelpush(JSON.stringify(data));
      };
    };

    // eslint-disable-next-line no-param-reassign
    channel.onerror = (e) => {
      console.error('channel.onerror', JSON.stringify(e, null, '\t'));
    };

    // eslint-disable-next-line no-param-reassign
    channel.onclose = (e) => {
      console.warn('channel.onclose', JSON.stringify(e, null, '\t'));
    };
  }

  private onIceCandidate(event: any) {
    this.socket.sendWSMessage({
      action: 'icecandidate',
      value: event.candidate,
    });
  }
}
</script>

<style>
</style>
