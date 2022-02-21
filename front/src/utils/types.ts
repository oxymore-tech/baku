export enum BakuAction {
  MOVIE_UPDATE_TITLE,
  MOVIE_UPDATE_SYNOPSIS,
  MOVIE_UPDATE_POSTER,
  MOVIE_INSERT_IMAGE,
  SHOT_ADD,
  CHANGE_FPS,
  MOVIE_REMOVE_IMAGE,
  SHOT_REMOVE,
  MOVIE_LOCK,
  SHOT_LOCK,
  SHOT_UPDATE_SYNOPSIS,
  SHOT_UPDATE_STORYBOARD,
  MOVIE_REVERSE_IMAGES,
  DELETE_MOVIE,
  SHOT_MOVE,
  AUDIO_ADD,
  AUDIO_ADD_WAV,
  AUDIO_REMOVE,
  AUDIO_UPDATE_TITLE,
  AUDIO_UPDATE_SOUND,
  AUDIO_UPDATE_VOLUME,
  AUDIO_UPDATE_DURATION,
  AUDIO_UPDATE_WAVEFORM,
  SOUNDTIMELINE_ADD,
  SOUNDTIMELINE_REMOVE,
  SOUNDTIMELINE_UPDATE_START
}

export interface BakuEvent {
  readonly action: BakuAction;
  readonly value: any;
  readonly user: string;
  readonly timestamp: Date;
}

export enum VideoStatusEnum {
  UpToDate = "UpToDate",
  NotUpToDate = "NotUpToDate",
  Pending = "Pending",
  NotGenerated = "NotGenerated"
}

export interface VideoStatus {
  readonly status: VideoStatusEnum;
  readonly lastModified: number;
}

export type Duration = {
  hours: number;
  minutes: number;
  seconds: number;
};
