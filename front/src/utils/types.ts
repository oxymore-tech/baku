export enum BakuAction {
  MOVIE_UPDATE_TITLE,
  MOVIE_UPDATE_SYNOPSIS,
  MOVIE_UPDATE_POSTER,
  MOVIE_INSERT_IMAGE,
  SHOT_ADD,
  CHANGE_FPS,
  MOVIE_REMOVE_IMAGE,
  SHOT_REMOVE,
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
