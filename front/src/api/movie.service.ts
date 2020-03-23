import { BakuAction, BakuEvent } from '@/api/baku.service';
import { ImageRef, UploadedImage } from './uploadedImage.class';

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
  DELETE = 46
}

export interface Movie {
  readonly title: string;
  readonly synopsis: string;
  readonly poster?: ImageRef;
  readonly shots: Shot[];
  readonly fps: number;
}

export interface Shot {
  readonly id: string;
  readonly images: ImageRef[];
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
          });
          break;
        }
        case BakuAction.SHOT_REMOVE: {
          console.log('SHOT_REMOVE', event.value.shotId);
          console.log('shots', shots);
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
        default:
          break;
      }
    });
    return {
      title, synopsis, poster, shots, fps,
    };
  }
}
