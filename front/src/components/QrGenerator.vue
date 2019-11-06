<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="about">
    <h1>Qr Generator</h1>
    <h3>Scannez ce QR-Code depuis l'appli baku-ui depuis votre smartphone:</h3>
    {{value}}
    <qrcode :value="value" :options="options" v-if="value"></qrcode>
    <video id="remoteVideo" autoplay muted playsinline></video>
    <button id="captureButton">Capture!</button>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { WSMessage, WSSocket } from "./socket.class";

@Component
export default class QrGenerator extends Vue {
  value = "";

  options = {
    width: 100,
    scale: 1
  };

  socket = new WSSocket();

  remoteVideo: any = null;
  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]
  });
  dataChannel: RTCDataChannel = this.peerConnection.createDataChannel(
    "channel",
    {}
  );

  mounted() {
    const captureButton = document.getElementById(
      "captureButton"
    ) as HTMLElement;
    captureButton.addEventListener("click", this.capture.bind(this));
    console.log("IsConnected ?", this.$store.state.isConnected);

    this.remoteVideo = document.getElementById("remoteVideo");

    this.socket.messageListenerFunction = (message => {
      switch (message.action) {
        case "getSocketId":
          this.value = message.value;
          break;
        case "linkEstablished":
          this.createOffer().then(offer => {
            this.socket.sendWSMessage({ action: "rtcOffer", value: offer });
          });
          break;
        case "icecandidate":
          if (message.value) {
            this.peerConnection.addIceCandidate(message.value);
          }
          break;
        case "rtcAnswer":
          this.peerConnection
            .setRemoteDescription(message.value)
            .then(() => {});
          break;
      }
    });

    this.peerConnection.addEventListener(
      "track",
      this.gotRemoteStream.bind(this)
    );

    this.peerConnection.addEventListener(
      "icecandidate",
      this.onIceCandidate.bind(this)
    );

    this.peerConnection.onconnectionstatechange = event => {
      if (this.peerConnection.connectionState == "connected") {
        console.log("CONNECTION OK");
        // CONNECTION OK
        this.$store.commit("setupConnection");
      }
    };
  }

  public async createOffer() {
    this.setChannelEvents(this.dataChannel);

    // Creating the offset
    try {
      const offerOptions: RTCOfferOptions = {
        offerToReceiveVideo: true
      };
      const offer = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(offer);
      return offer;
      // TODO: Generate QR code with the offset
    } catch (e) {
      console.error("Error creating offer", e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === "upload") {
        // TODO: get img from the server with picture ID
        const pictureId = data.message;
      }
      console.log("Message received", event);
    };
    // channel.onopen = () => {
    //   const channelpush = channel.send;
    //   channel.send = (data: Object) => {
    //     console.log("Sending message: ", data);
    //     channelpush(JSON.stringify(data));
    //   };
    // };

    channel.onerror = function(e) {
      console.error("channel.onerror", JSON.stringify(e, null, "\t"));
    };

    channel.onclose = function(e) {
      console.warn("channel.onclose", JSON.stringify(e, null, "\t"));
    };
  }

  private onIceCandidate(event: any) {
    this.socket.sendWSMessage({ action: "icecandidate", value: event.candidate });
  }

  private gotRemoteStream(e: any) {
    console.log("pc2 gotRemoteStream");
    if (this.remoteVideo.srcObject !== e.streams[0]) {
      this.remoteVideo.srcObject = e.streams[0];
      console.log("pc2 received remote stream");
    }
  }

  private capture() {
    this.dataChannel.send(
      JSON.stringify({
        message: "capture",
        type: "cmd"
      })
    );
  }
}
</script>
