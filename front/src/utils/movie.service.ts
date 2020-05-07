import { BakuAction, BakuEvent } from '@/utils/types';
import { ImageRef, UploadedImage } from '@/utils/uploadedImage.class';

export enum KeyCodes {
  BACKSPACE = 8,
  TAB = 9,
  ENTER = 13,
  SHIFT = 16,
  CTRL = 17,
  ALT = 18,
  PAUSE = 19,
  CAPS_LOCK = 20,
  ESCAPE = 27,
  SPACE = 32,
  PAGE_UP = 33,
  PAGE_DOWN = 34,
  END = 35,
  HOME = 36,
  LEFT_ARROW = 37,
  UP_ARROW = 38,
  RIGHT_ARROW = 39,
  DOWN_ARROW = 40,
  INSERT = 45,
  DELETE = 46,
  C = 67,
  V = 86
}

export interface Movie {
  readonly title: string;
  readonly synopsis: string;
  readonly poster?: ImageRef;
  readonly shots: Shot[];
  readonly fps: number;
  readonly locked: boolean;
}

export interface Shot {
  readonly id: string;
  readonly images: ImageRef[];
  readonly locked: boolean;
  readonly synopsis: string;
  readonly storyboard?: ImageRef;
}

export interface ReadingSliderBoundaries {
  left: number;
  right: number;
}

export interface ReadingSliderValue extends ReadingSliderBoundaries {
  selected: number;
}

export class MovieService {
  public static merge(projectId: string, events: BakuEvent[]): Movie {
    let title = 'Projet sans nom';
    let synopsis = 'Synopsis vide';
    let poster;
    let fps = 12;
    let locked = false;
    const shots: Shot[] = [];

    const updateShot = (shotId: string, updateFn: (shot: Shot) => Shot) => {
      const shotIndex = shots.findIndex((p) => p.id === shotId);
      const shot = shots.find((p) => p.id === shotId);
      if (!shot) {
        throw new Error(`shot ${shotId} should exist for project ${title}`);
      }
      shots.splice(shotIndex, 1, updateFn(shot));
    };

    events.forEach((event) => {
      switch (event.action) {
        case BakuAction.MOVIE_UPDATE_TITLE:
          title = event.value;
          break;
        case BakuAction.MOVIE_UPDATE_SYNOPSIS:
          synopsis = event.value;
          break;
        case BakuAction.MOVIE_UPDATE_POSTER:
          poster = event.value;
          break;
        case BakuAction.MOVIE_INSERT_IMAGE: {
          const { shotId, imageIndex, image } = event.value as { shotId: string, imageIndex: number, image: string };
          updateShot(shotId, (shot: Shot) => {
            shot.images.splice(imageIndex, 0, new UploadedImage(projectId, image));
            return shot;
          });

          break;
        }
        case BakuAction.SHOT_ADD: {
          shots.push({
            id: event.value.shotId,
            images: [],
            locked: false,
            synopsis: '',
          });
          break;
        }
        case BakuAction.SHOT_REMOVE: {
          const shotIndex = shots.findIndex((shot) => shot.id === event.value.shotId);
          shots.splice(shotIndex, 1);
          break;
        }
        case BakuAction.MOVIE_REMOVE_IMAGE: {
          const { shotId, imageIndex } = event.value as { shotId: string, imageIndex: number };
          updateShot(shotId, (shot: Shot) => {
            shot.images.splice(imageIndex, 1);
            return shot;
          });
          break;
        }
        case BakuAction.CHANGE_FPS: {
          fps = event.value;
          break;
        }
        case BakuAction.SHOT_LOCK: {
          updateShot(event.value.shotId, (shot: Shot) =>
            ({...shot, locked: event.value.locked})
          );
          break;
        }
        case BakuAction.MOVIE_LOCK: {
          locked = event.value;
        }
        case BakuAction.SHOT_UPDATE_SYNOPSIS: {
          updateShot(event.value.shotId, (shot: Shot) =>
            ({...shot, synospsis: event.value.synopsis})
          )
        }
        case BakuAction.SHOT_UPDATE_STORYBOARD: {
          updateShot(event.value.shotId, (shot: Shot) =>
            ({...shot, storyboard: event.value.storyboard})
          )
        }
        default:
          break;
      }
    });
    return {
      title, synopsis, poster, shots, fps, locked
    };
  }
}
