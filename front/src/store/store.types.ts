import { ActionContext, Module } from 'vuex';
import { Device } from '@/utils/device.class';
import { BakuEvent } from '@/utils/types';
import { WSSocket } from '@/utils/socket.class';

export interface CaptureState {
  stream: MediaStream | null;
  activeDevice: Device | null,
  scaleX: number;
  scaleY: number;
  onionSkinDisplay: boolean;
  onionSkinValue: number;
}

export interface ProjectState {
  id: string;
  activeShotId: string | null;
  history: BakuEvent[];
  pendingActions: number;
}

export interface SeenProject {
  id: string;
  adminId?: string;
  title: string;
  posterUrl?: string;
  synopsis?: string;
  locked?: boolean;
  totalImages?: number;
  fps?: number;
  lastUpdate?: Date;
}

export interface UserState {
  username: string;
  seenProjects: SeenProject[];
  usercolor: string;
}

export interface ClipboardState{
  images: string[];
}

export interface BakuRootState {
  webrtc: WebrtcState,
  project: ProjectState,
  capture: CaptureState,
  user: UserState,
  clipboard: ClipboardState
}


export type SocketStatus = 'opened' | 'closed' | 'error';

export interface WebrtcState {
  peerConnection: undefined | RTCPeerConnection,
  dataChannel: null | RTCDataChannel,
  stream: undefined | MediaStream,
  isConnected: boolean,
}

export interface SocketState {
  socket: WSSocket,
  socketStatus: SocketStatus,
}

export type BakuActionContext<TState> = ActionContext<TState, BakuRootState>;
export type BakuModule<TState> = Module<TState, BakuRootState>;
