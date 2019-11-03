<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="about">
    <h1>{{title}}</h1>
    <h3>Scannez ce QR-Code depuis l'appli baku-ui depuis votre smartphone:</h3>
    {{value}}
    <qrcode :value="value" :options="options" v-if="value"></qrcode>
    <video id="remoteVideo" autoplay muted playsinline></video>
    <button id="captureButton">Capture!</button>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import io from "socket.io-client";

@Component
export default class QrGenerator extends Vue {
  title = "Qr Generator";
  value = "";

  options = {
    width: 100,
    scale: 1
  };

  socketId = "";
  socket: SocketIOClient.Socket = io();

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
    const captureButton = document.getElementById("captureButton") as HTMLElement;
    captureButton.addEventListener("click", this.capture.bind(this));
    console.log("IsConnected ?", this.$store.state.isConnected);

    this.remoteVideo = document.getElementById("remoteVideo");

    this.socket.on("connect", () => {
      this.socketId = this.socket.id;
      this.value = JSON.stringify(this.socketId);
    });

    this.socket.on("linkEstablished", (msg: any) => {
      this.createOffer().then(offer => {
        this.socket.emit("rtcOffer", offer);
      });
    });

    this.socket.on("icecandidate", (msg: any) => {
      console.log("icecandidate", msg);
      if (msg) {
        this.peerConnection.addIceCandidate(msg);
      }
    });

    this.socket.on("rtcAnswer", (msg: any) => {
      console.log("RTC AnsWER2", msg);
      this.peerConnection.setRemoteDescription(msg).then(() => {});
    });

    this.peerConnection.addEventListener(
      "track",
      this.gotRemoteStream.bind(this)
    );

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

  private onIceCandaidate(event: any) {
    this.socket.emit("icecandidate", event.candidate);
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
