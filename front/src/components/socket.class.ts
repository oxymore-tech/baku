import store from '@/store';

type WSMessageAction = 'getSocketId' | 'linkEstablished' | 'rtcOffer' | 'icecandidate' | 'rtcAnswer' | 'link';

interface WSMessage {
  action: WSMessageAction;
  value?: any;
}

export class WSSocket {
  private socket!: WebSocket;

  constructor() {
    try {
      this.socket = new WebSocket(`wss://${location.hostname}:3030/echo`);
    } catch (e) {
      store.commit('setSocketStatus', 'error');
    }

    this.socket.addEventListener('error', () => {
      store.commit('setSocketStatus', 'error');
    });
    this.socket.addEventListener('open', () => {
      store.commit('setSocketStatus', 'opened');
      this.sendWSMessage({ action: 'getSocketId' });
    });

    this.socket.addEventListener('message', (event) => {
      const message: WSMessage = JSON.parse(event.data);
      this.messageListenerFunction(message);
    });
  }
  public messageListenerFunction: (message: WSMessage) => void = () => { };

  public sendWSMessage(msg: WSMessage) {
    this.socket.send(JSON.stringify(msg));
  }
  public close() {
    this.socket.close();
    store.commit('setSocketStatus', 'closed');
  }
}
