<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Synchroniser la caméra smartphone</p>
    </header>
    <section class="modal-card-body">
      <ul>
        <li>Aller sur XXX avec votre smartphone</li>
        <li>Autoriser la caméra</li>
        <li>Fixer le QR Code avec la caméra de votre smartphone</li>
      </ul>
      <qrcode :value="qrvalue" :options="options" v-if="qrvalue && status !== 'CONNECTED'"></qrcode>
      <h1
        class="title is-4 has-text-warning"
        v-if="status === 'WAITING'"
      >Synchronisation en attente...</h1>
      <h1 class="title is-4 has-text-danger" v-if="status === 'ERROR'">Erreur de synchronisation</h1>
      <h1 class="title is-4 has-text-success" v-if="status === 'CONNECTED'">Synchronisation OK</h1>
    </section>
    <footer class="modal-card-foot">
      <b-button class="button" type="button" @click="$parent.close()">Fermer</b-button>
    </footer>
  </div>
</template>

<style lang="scss">
</style>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { WSSocket } from "./socket.class";
import { State } from "vuex-class";
import { SocketStatus } from "../store";

type Status = "CONNECTED" | "ERROR" | "WAITING";

@Component
export default class QrGenerator extends Vue {
  public qrvalue = "";
  public status: Status = "WAITING";

  public options = {
    width: 200,
    scale: 1,
  };

  @State
  private socketStatus!: SocketStatus;

  private socket!: WSSocket;
  private peerConnection!: RTCPeerConnection;
  private dataChannel!: RTCDataChannel;

  public mounted() {
    this.socket = new WSSocket();
    if (this.socketStatus !== "opened") {
      this.status = "ERROR";
    }
  }

  public beforeDestroy() {
    this.socket.close();
  }

  @Watch("socketStatus")
  public onSocketStatusChanged() {
    if (this.socketStatus !== "opened") {
      this.status = "ERROR";
      return;
    }
    this.status = "WAITING";

    this.socket.messageListenerFunction = (message) => {
      switch (message.action) {
        case "getSocketId":
          this.qrvalue = message.value;
          break;
        case "linkEstablished":
          this.createOffer().then((offer) => {
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
            .then(() => { });
          break;
      }
    };
  }

  public async createOffer() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    this.peerConnection.addEventListener(
      "track",
      this.gotRemoteStream.bind(this),
    );

    this.peerConnection.addEventListener(
      "icecandidate",
      this.onIceCandidate.bind(this),
    );

    this.peerConnection.onconnectionstatechange = (event) => {
      if (this.peerConnection.connectionState === "connected") {
        // CONNECTION OK
        console.log("CONNECTION OK");
        this.status = "CONNECTED";
        this.$store.commit("setDataChannel", this.dataChannel);
        this.$store.commit("setPeerCOnnection", this.peerConnection);
        this.$store.commit("setupConnection");
      }
    };

    this.dataChannel = this.peerConnection.createDataChannel("channel", {});

    // Creating the offset
    try {
      const offerOptions: RTCOfferOptions = {
        offerToReceiveVideo: true,
      };
      const offer = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (e) {
      console.error("Error creating offer", e);
      this.status = "ERROR";
    }
  }


  private onIceCandidate(event: any) {
    this.socket.sendWSMessage({
      action: "icecandidate",
      value: event.candidate,
    });
  }

  private gotRemoteStream(e: any) {
    this.$store.commit("setMediaStream", e.streams[0]);
  }
}
</script>
