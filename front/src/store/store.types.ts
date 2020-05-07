import { ActionContext, Module } from 'vuex';
import { Device } from '@/utils/device.class';
import { BakuEvent } from '@/utils/types';

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
  posterUrl: string;
  synopsis?: string;
  locked?: boolean;
}

export interface UserState {
  username: string;
  seenProjects: SeenProject[];
}

export interface BakuRootState {
  webrtc: WebrtcState,
  project: ProjectState,
  capture: CaptureState,
  user: UserState,
}

export type SocketStatus = 'opened' | 'closed' | 'error';

export interface WebrtcState {
  peerConnection: undefined | RTCPeerConnection,
  dataChannel: null | RTCDataChannel,
  stream: undefined | MediaStream,
  isConnected: boolean,
  socketStatus: SocketStatus,
}

export type BakuActionContext<TState> = ActionContext<TState, BakuRootState>;
export type BakuModule<TState> = Module<TState, BakuRootState>;
