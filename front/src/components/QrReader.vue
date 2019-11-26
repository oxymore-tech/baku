<template>
  <div>
    <h1>QR Reader Page</h1>

    <p class="error">{{ error }}</p>

    <p class="decode-result">
      Last result:
      <b>{{ socketId }}</b>
    </p>

    <qrcode-stream @decode="onDecode" @init="onInit" v-if="activeqrreader" />
    <video id="localVideo" autoplay playsinline v-else width="1920" height="1080"></video>
  </div>
</template>


<script lang='ts'>
import { QrcodeStream } from 'vue-qrcode-reader';
import { Component, Vue } from 'vue-property-decorator';
import { WSSocket } from './socket.class';
import { Device } from '@/api/device.class';
@Component({
  components: { QrcodeStream },
})
export default class QrReader extends Vue {
  public socketId: string | undefined = '';

  public socket = new WSSocket();

  public localVideo: any;

  public error = '';

  public peerConnection!: RTCPeerConnection;

  public activeqrreader = true;

  private device = new Device('smartphone', 'Smartphone');

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
  }

  public onDecode(result: string) {
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

    this.peerConnection.onconnectionstatechange = (event) => {
      if (this.peerConnection.connectionState === 'connected') {
        // CONNECTION OK
        console.log('CONNECTION OK');
        this.$store.commit('setupConnection');
      }
      console.log(this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'disconnected') {
        delete this.peerConnection;
        this.localVideo.srcObject
          .getTracks()
          .forEach((track: MediaStreamTrack) => {
            track.stop();
          });
        this.activeqrreader = true;
        this.socketId = undefined;
      }
    };

    if (!this.socketId) {
      this.activeqrreader = false;
      this.socketId = JSON.parse(result);
      this.socket.sendWSMessage({ action: 'link', value: this.socketId });
    }
  }

  public async onInit(promise: Promise<any>) {
    try {
      await promise;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        this.error = 'ERROR: you need to grant camera access permisson';
      } else if (error.name === 'NotFoundError') {
        this.error = 'ERROR: no camera on this device';
      } else if (error.name === 'NotSupportedError') {
        this.error = 'ERROR: secure context required (HTTPS, localhost)';
      } else if (error.name === 'NotReadableError') {
        this.error = 'ERROR: is the camera already in use?';
      } else if (error.name === 'OverconstrainedError') {
        this.error = 'ERROR: installed cameras are not suitable';
      } else if (error.name === 'StreamApiNotSupportedError') {
        this.error = 'ERROR: Stream API is not supported in this browser';
      }
    }
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
      .forEach(track => this.peerConnection.addTrack(track, stream));
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
        const pictureId = await this.device.capture('localVideo', data.projectId, data.plan);
        channel.send(
          JSON.stringify({
            type: 'upload',
            message: pictureId,
          }),
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

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
</style>
