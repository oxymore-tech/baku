<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="qrGenerator">
    <qrcode :value="value" :options="options" v-if="value && !peerConnected"></qrcode>
    <div
      id="captureButton"
      class="captureButton"
      v-bind:class="{ capturing: isCapturing, hidden: !peerConnected }"
    >Capture!</div>
  </div>
</template>

<style lang="scss">
.captureButton {
  font-size: 30px;
  cursor: pointer;
  color: #e66359;
  text-align: center;
}

.hidden {
  display: none;
}

.capturing {
  color: grey;
  cursor: progress;
}
</style>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Map, Set } from 'immutable';
import { WSMessage, WSSocket } from './socket.class';

@Component
export default class QrGenerator extends Vue {
  public title = 'Qr Generator';
  public value = '';

  public options = {
    width: 150,
    scale: 1,
  };

  public socket = new WSSocket();
  public peerConnected = false;
  public isCapturing = false;

  public remoteVideo: any = null;
  public peerConnection!: RTCPeerConnection;
  public dataChannel!: RTCDataChannel;

  public beforeDestroy() {
    this.$store.commit('capture/detachMediaStream');
    if (this.peerConnection) {
      this.peerConnection.close();
      delete this.dataChannel;
      delete this.peerConnection;
    }
  }

  public mounted() {
    const captureButton = document.getElementById(
      'captureButton',
    ) as HTMLElement;
    captureButton.addEventListener('click', this.capture.bind(this));

    this.socket.messageListenerFunction = (message) => {
      switch (message.action) {
        case 'getSocketId':
          this.value = message.value;
          break;
        case 'linkEstablished':
          this.createOffer().then((offer) => {
            this.socket.sendWSMessage({ action: 'rtcOffer', value: offer });
          });
          break;
        case 'icecandidate':
          if (message.value) {
            this.peerConnection.addIceCandidate(message.value);
          }
          break;
        case 'rtcAnswer':
          this.peerConnection
            .setRemoteDescription(message.value)
            .then(() => { });
          break;
      }
    };
  }

  public async createOffer() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    this.peerConnection.addEventListener(
      'track',
      this.gotRemoteStream.bind(this),
    );

    this.peerConnection.addEventListener(
      'icecandidate',
      this.onIceCandidate.bind(this),
    );

    this.peerConnection.onconnectionstatechange = (event) => {
      if (this.peerConnection.connectionState === 'connected') {
        this.peerConnected = true;
        console.log('CONNECTION OK');
        // CONNECTION OK
        this.$store.commit('setupConnection');
      }
    };
    this.dataChannel = this.peerConnection.createDataChannel('channel', {});
    this.setChannelEvents(this.dataChannel);

    // Creating the offset
    try {
      const offerOptions: RTCOfferOptions = {
        offerToReceiveVideo: true,
      };
      const offer = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (e) {
      console.error('Error creating offer', e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = (event) => {
      // TODO: Try to understand why you need TWO json parse
      const data = JSON.parse(JSON.parse(event.data));
      if (data.type === 'upload') {
        this.isCapturing = false;
        const pictureId = data.message;
        this.$store.dispatch('plan/addNewPictureAction', pictureId);
      }
      console.log('Message received', event);
    };

    channel.onerror = (e) => {
      console.error('channel.onerror', JSON.stringify(e, null, '\t'));
    };

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

  private gotRemoteStream(e: any) {
    console.log('pc2 gotRemoteStream');
    this.$store.commit('capture/attachMediaStream', e.streams[0]);
  }

  private capture() {
    this.isCapturing = true;
    this.dataChannel.send(
      JSON.stringify({
        message: 'capture',
        plan: this.$store.state.plan.activePlan,
        type: 'cmd',
      }),
    );
  }
}
</script>
