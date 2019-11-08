type WSMessageAction = 'getSocketId' | 'linkEstablished' | 'rtcOffer' | 'icecandidate' | 'rtcAnswer' | 'link';

interface WSMessage {
  action: WSMessageAction;
  value?: any;
}

export class WSSocket {
  private socket: WebSocket;

  constructor() {
    // this.socket = new WebSocket("ws://localhost:3030/echo");
    console.log('Hostname', location.hostname, location);
    this.socket = new WebSocket(`wss://${location.hostname}:3030/echo`);

    this.socket.addEventListener('open', () => {
      console.log('Socket opened');
      this.sendWSMessage({ action: 'getSocketId' });
    });

    this.socket.addEventListener('message', (event) => {
      console.log('Message received', event.data);
      const message: WSMessage = JSON.parse(event.data);
      this.messageListenerFunction(message);
    });
  }
  public messageListenerFunction: (message: WSMessage) => void = () => { };

  public sendWSMessage(msg: WSMessage) {
    this.socket.send(JSON.stringify(msg));
  }
}
