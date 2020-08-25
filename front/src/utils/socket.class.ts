import store from '@/store';

type WSMessageAction = 'getSocketId' | 'linkEstablished' | 'rtcOffer' | 'icecandidate' | 'rtcAnswer' | 'link';

export interface WSMessage {
  action: WSMessageAction;
  value?: any;
}

export class WSSocket {
  private socket!: WebSocket;

  constructor() {
    try {
      this.socket = new WebSocket(`wss://${window.location.hostname}:${window.location.port}/echo`);
    } catch (e) {
      store.dispatch('socket/setSocketStatus', 'error');
    }

    this.socket.addEventListener('error', () => {
      // store.dispatch('webrtc/setSocketStatus', 'error');
    });
    this.socket.addEventListener('open', () => {
      store.dispatch('socket/setSocketStatus', 'opened');
      this.sendWSMessage({ action: 'getSocketId' });
    });

    this.socket.addEventListener('message', (event) => {
      const message: WSMessage = JSON.parse(event.data);
      this.messageListenerFunction(message);
    });

  }

  public messageListenerFunction: (message: WSMessage) => void = (message: WSMessage) => {
    switch (message.action) {
      case 'getSocketId':
        store.dispatch('socket/setSocketId', message.value);
        break;
      default:
        break;
    }
  }

  public sendWSMessage(msg: WSMessage) {
    this.socket.send(JSON.stringify(msg));
  }

  public addEventListener(category: string, callback: EventListenerOrEventListenerObject){
    this.socket.addEventListener(category, callback);
  }

  public close() {
    this.socket.close();
    store.dispatch('socket/setSocketStatus', 'closed');
  }
}
