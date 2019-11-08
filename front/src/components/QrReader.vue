<template>
  <div class="about">
    <h1>This is an about page</h1>

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

import { Component, Vue, Watch } from 'vue-property-decorator';
import { Map, Set } from 'immutable';
import * as uuid from 'uuid';
import { WSSocket } from './socket.class';

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
      .forEach((track) => this.peerConnection.addTrack(track, stream));
    try {
      console.log('remoteOffer', remoteOffer, this.peerConnection);
      const res = await this.peerConnection.setRemoteDescription(remoteOffer);
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
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'cmd') {
        const canvas = document.createElement('canvas');
        const video = document.getElementById('localVideo') as any;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context2d = canvas.getContext('2d') as CanvasRenderingContext2D;
        context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');

        const formData = new FormData();
        const blob = imagetoblob(base64);
        formData.append('image', blob, uuid.v4() + '.jpg');
        const request = new XMLHttpRequest();
        request.open(
          'POST',
          `https://${location.host}/default/upload/${data.plan}`,
        );
        request.onreadystatechange = function() {
          // Appelle une fonction au changement d'état.
          if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            const pictureId = JSON.parse(this.response)[0];
            channel.send(
              JSON.stringify({
                type: 'upload',
                message: pictureId,
              }),
            );
          }
        };

        request.send(formData);
        // var link = document.createElement('a');

        // link.setAttribute('href', base64);
        // link.setAttribute('download', 'toto.png');
        // link.click();
      }
    };
    channel.onopen = () => {
      const channelpush = channel.send;
      channel.send = (data: any) => {
        console.log('Sending message: ', data);
        channelpush(JSON.stringify(data));
      };
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
}

function b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

function imagetoblob(base64String: string) {
  const ImageURL = base64String;
  // Split the base64 string in data and contentType
  const block = ImageURL.split(';');
  // Get the content type of the image
  const contentType = block[0].split(':')[1]; // In this case 'image/gif'
  // get the real base64 content of the file
  const realData = block[1].split(',')[1]; // In this case 'R0lGODlhPQBEAPeoAJosM....'

  // Convert it to a blob to upload
  return b64toBlob(realData, contentType);
}
</script>

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
</style>