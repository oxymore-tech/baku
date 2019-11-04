<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="qrGenerator">
    <qrcode :value="value" :options="options" v-if="value && !peerConnected"></qrcode>
    <video id="remoteVideo" autoplay muted playsinline v-bind:class="{ hidden: !peerConnected }" width="280px" height="157px"></video>
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
  text-align:center;
}

#remoteVideo {
  height: 157px;
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

  peerConnected = false;
  isCapturing = false;

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
    const captureButton = document.getElementById(
          "captureButton"
        ) as HTMLElement;
        captureButton.addEventListener("click", this.capture.bind(this));
    this.$store.commit('plan/addNewPicture', '7949552a-0b9f-42a2-ac34-fc70452fc26b');

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
        this.peerConnected = true;
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
    } catch (e) {
      console.error("Error creating offer", e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = event => {
      //TODO: Try to understand why you need TWO json parse
      const data = JSON.parse(JSON.parse(event.data));
      if (data.type === "upload") {
        this.isCapturing = false;
        const pictureId = data.message;
        this.$store.commit('plan/addNewPicture', pictureId);
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
    this.isCapturing = true;
    this.dataChannel.send(
      JSON.stringify({
        message: "capture",
        type: "cmd"
      })
    );
  }
}
</script>
