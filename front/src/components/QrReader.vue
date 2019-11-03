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


<script lang="ts">
import { QrcodeStream } from "vue-qrcode-reader";

import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import io from "socket.io-client";
import * as uuid from "uuid";

@Component({
  components: { QrcodeStream }
})
export default class QrReader extends Vue {
  socketId: string | undefined = undefined;
  socket = io();
  localVideo: any;
  error = "";
  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]
  });

  activeqrreader = true;

  mounted() {
    this.socket.on("rtcOffer", (msg: any) => {
      console.log("call startStream ", msg);
      this.startStream(msg);
    });

    this.socket.on("icecandidate", (msg: any) => {
      this.peerConnection.addIceCandidate(msg);
    });

    this.peerConnection.addEventListener(
      "icecandidate",
      this.onIceCandaidate.bind(this)
    );

    this.peerConnection.onconnectionstatechange = event => {
      if (this.peerConnection.connectionState == "connected") {
        console.log("CONNECTION OK");
        // CONNECTION OK
        this.$store.commit("setupConnection");
      }
    };
  }

  onDecode(result: string) {
    console.log("onDecode", result, this.socketId);
    if (!this.socketId) {
      this.activeqrreader = false;
      this.socketId = result;
      this.socket.emit("link", this.socketId);
    }
  }

  async onInit(promise: Promise<any>) {
    try {
      await promise;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        this.error = "ERROR: you need to grant camera access permisson";
      } else if (error.name === "NotFoundError") {
        this.error = "ERROR: no camera on this device";
      } else if (error.name === "NotSupportedError") {
        this.error = "ERROR: secure context required (HTTPS, localhost)";
      } else if (error.name === "NotReadableError") {
        this.error = "ERROR: is the camera already in use?";
      } else if (error.name === "OverconstrainedError") {
        this.error = "ERROR: installed cameras are not suitable";
      } else if (error.name === "StreamApiNotSupportedError") {
        this.error = "ERROR: Stream API is not supported in this browser";
      }
    }
  }

  private async startStream(remoteOffer: any) {
    this.localVideo = document.getElementById("localVideo");
    const stream = await navigator.mediaDevices.getUserMedia({
      video:  {
        width: { min: 1280 },
        height: { min: 720 },
        facingMode: {
          exact: "environment"
        }
      }
    });
    console.log("Received local stream");
    this.localVideo.srcObject = stream;
    // TODO: get remoteOffer from QR

    this.peerConnection.ondatachannel = event => {
      const dataChannel = event.channel;
      this.setChannelEvents(dataChannel);
    };

    stream
      .getVideoTracks()
      .forEach(track => this.peerConnection.addTrack(track, stream));
    try {
      console.log("remoteOffer", remoteOffer, this.peerConnection);
      const res = await this.peerConnection.setRemoteDescription(remoteOffer);
    } catch (e) {
      console.error("Failed to set remote description", e);
    }

    try {
      console.log("createAnswer", this.socketId);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit("rtcAnswer", answer);
    } catch (e) {
      console.error("Failed sending answer", e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = function(event) {
      let data = JSON.parse(event.data);
      if (data.type === "cmd") {
        const canvas = document.createElement("canvas");
        const video = document.getElementById("localVideo") as any;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context2d = canvas.getContext("2d") as CanvasRenderingContext2D;
        context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL();

        var formData = new FormData();
        const blob = imagetoblob(base64);
        console.log('blob size:', blob.size);
        formData.append('image', blob, uuid.v4());
        var request = new XMLHttpRequest();
        request.open("POST", `https://${location.hostname}/back/totoproject/upload/`);
        request.send(formData);
        // var link = document.createElement("a");

        // link.setAttribute("href", base64);
        // link.setAttribute("download", "toto.png");
        // link.click();
      }
    };
    channel.onopen = function() {
      const channelpush = channel.send;
      channel.send = (data: Object) => {
        console.log("Sending message: ", data);
        channelpush(JSON.stringify(data));
      };
    };

    channel.onerror = function(e) {
      console.error("channel.onerror", JSON.stringify(e, null, "\t"));
    };

    channel.onclose = function(e) {
      console.warn("channel.onclose", JSON.stringify(e, null, "\t"));
    };
  }

  private onIceCandaidate(event: any) {
    this.socket.emit("icecandidate", event.candidate);
  }
}

function b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
  contentType = contentType || "";
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

function imagetoblob(base64String: string) {
  var ImageURL = base64String;
  // Split the base64 string in data and contentType
  var block = ImageURL.split(";");
  // Get the content type of the image
  var contentType = block[0].split(":")[1]; // In this case "image/gif"
  // get the real base64 content of the file
  var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

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