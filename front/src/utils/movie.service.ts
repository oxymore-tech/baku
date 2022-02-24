import { BakuAction, BakuEvent, Duration } from '@/utils/types';
import { ImageRef, Quality, UploadedImage } from '@/utils/uploadedImage.class';
import * as _ from 'lodash';
import { SeenProject } from '@/store/store.types';

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
  readonly audios: Audio[];
  readonly dataTimeline: any;
  readonly soundsTimeline: SoundTimeline[];
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

export interface Audio {
  readonly id: string;
  readonly title?: string;
  readonly sound?: Blob;
  readonly waveform?: Blob;
  readonly volume?: number;
  readonly duration?: number;
}

export interface SoundTimeline {
  readonly id: string;
  readonly audioId: string;
  readonly pisteNumber : number;
  readonly start : number;
  readonly end : number;
  readonly title : String;
}

export interface ReadingSliderBoundaries {
  left: number;
  right: number;
}

export interface ReadingSliderValue extends ReadingSliderBoundaries {
  selected: number;
}

export class MovieService {

  public static getLastUpdate(history?: BakuEvent[]): Date | undefined {
    if (history) {
      return history[history.length - 1]?.timestamp;
    } else {
      return undefined;
    }
  }

  public static getTotalImages(movie: Movie) {
    return movie.shots.reduce((count, shot) => count + shot.images.reduce((count) => count + 1, 0), 0);
  }

  public static removeDoublons(newSeenProjects: SeenProject[]) {
    let result: SeenProject[] = [];
    const map = new Set();
    for (const item of newSeenProjects) {
      if (!map.has(item.id)) {
        map.add(item.id);
        result.push(item);
      } else {
        result = result.map(olditem => {
          if (olditem.id === item.id) {
            return item.adminId ? item : olditem;
          }
          return olditem;
        })
      }
    }
    return result;
  }

  public static getImagesString(imageNumber: number): string {
    if (!imageNumber) {
      return "pas encore d'image";
    } else if (imageNumber == 1) {
      return "1 image";
    } else {
      return imageNumber + " images";
    }
  }

  public static getDurationString(duration: Duration, short = false): string {
    if (duration.hours) {
      return (
        duration.hours +
        "h " +
        duration.minutes +
        "min " +
        duration.seconds +
        "s"
      );
    } else if (duration.minutes) {
      return duration.minutes + "min " + duration.seconds + "s";
    } else if (duration.seconds > 1) {
      return duration.seconds + " s";
    } else if (duration.seconds == 1) {
      return duration.seconds + " s";
    } else {
      if (!short) {
        return "moins d'une seconde";
      } else {
        return "<1s";
      }
    }
  }

  public static merge(projectId: string, events: BakuEvent[]): Movie {
    let title = 'Film sans nom';
    let synopsis = 'Synopsis vide';
    let poster;
    let fps = 12;
    let locked = false;
    const shots: Shot[] = [];
    const audios: Audio[] = [];
    let dataTimeline : any = [];
    const soundsTimeline : SoundTimeline[] = [];

    const updateShot = (shotId: string, updateFn: (shot: Shot) => Shot) => {
      const shotIndex = shots.findIndex((p) => p.id === shotId);
      const shot = shots.find((p) => p.id === shotId);
      if (!shot) {
        throw new Error(`shot ${shotId} should exist for project ${title}`);
      }
      shots.splice(shotIndex, 1, updateFn(shot));
    };

    const updateAudio = (audioId: string, updateFn: (audio: Audio) => Audio) => {
      const audioIndex = audios.findIndex((p) => p.id === audioId);
      const audio = audios.find((p) => p.id === audioId);
      if (!audio) {
        throw new Error(`audio ${audioId} should exist for project ${title}`);
      }
      audios.splice(audioIndex, 1, updateFn(audio));
    };

    const updateSoundTimeline = (soundTimelineId: string, updateFn: (soundTimeline: SoundTimeline) => SoundTimeline) => {
      const soundTimelineIndex = soundsTimeline.findIndex((p) => p.id === soundTimelineId);
      const soundTimeline = soundsTimeline.find((p) => p.id === soundTimelineId);
      if (!soundTimeline) {
        throw new Error(`soundTimeline ${soundTimeline} should exist for project ${title}`);
      }
      soundsTimeline.splice(soundTimelineIndex, 1, updateFn(soundTimeline));
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
          const {shotId, imageIndex, image} = event.value as { shotId: string, imageIndex: number, image: string };
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
        case BakuAction.AUDIO_ADD_WAV: {
          const {
            title,
            sound,
            duration,
            audioId
          } = event.value as { title: string, sound: Blob, duration: number, audioId: string };
          audios.push({
            id: audioId,
            title: title,
            sound: sound,
            volume: 100,
            duration: duration,
          });
          break;
        }
        case BakuAction.SHOT_REMOVE: {
          const shotIndex = shots.findIndex((shot) => shot.id === event.value.shotId);
          shots.splice(shotIndex, 1);
          break;
        }
        case BakuAction.SHOT_MOVE: {
          const shotIndex = shots.findIndex((shot) => shot.id === event.value.shotId);
          let index = event.value.index;
          if (index < 0) {
            index = 0;
          } else if (index > shots.length - 1) {
            index = shots.length - 1;
          }
          shots.splice(index, 0, shots.splice(shotIndex, 1)[0]);
          break;
        }
        case BakuAction.MOVIE_REMOVE_IMAGE: {
          const {shotId, imageIndex} = event.value as { shotId: string, imageIndex: number };
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
          break;
        }
        case BakuAction.SHOT_UPDATE_SYNOPSIS: {
          updateShot(event.value.shotId, (shot: Shot) =>
            ({...shot, synopsis: event.value.synopsis})
          )
          break;
        }
        case BakuAction.SHOT_UPDATE_STORYBOARD: {
          updateShot(event.value.shotId, (shot: Shot) =>
            ({...shot, storyboard: event.value.storyboard})
          )
          break;
        }
        case BakuAction.MOVIE_REVERSE_IMAGES: {
          const {shotId, imageIndexLeft, imageIndexRight} = event.value as { shotId: string, imageIndexLeft: number, imageIndexRight: number };
          updateShot(shotId, (shot: Shot) => {
            const leftPart = shot.images.slice(0, imageIndexLeft) || [];
            const reversed = _.reverse(shot.images.slice(imageIndexLeft, imageIndexRight + 1));
            const rightPart = shot.images.slice(imageIndexRight + 1);
            return {...shot, images: leftPart.concat(reversed, rightPart)};
          })
          break;
        }
          case BakuAction.AUDIO_ADD: {
            const {title, sound, duration} = event.value.params as { title: string, sound: Blob, duration : number };
            audios.push({
              id: event.value.audioId,
              title: title,
              sound: sound,
              volume: 100,
              duration: duration,
            });
            break;
          }
          case BakuAction.AUDIO_REMOVE: {
            const audioIndex = audios.findIndex((audio) => audio.id === event.value.audioId);
            audios.splice(audioIndex, 1);
            break;
          }
          case BakuAction.AUDIO_UPDATE_SOUND: {
            updateAudio(event.value.audioId, (audio: Audio) =>
              ({...audio, sound: event.value.sound})
            )
            break;
          }
          case BakuAction.AUDIO_UPDATE_TITLE: {
            updateAudio(event.value.audioId, (audio: Audio) =>
              ({...audio, title: event.value.title})
            )
            break;
          }
          case BakuAction.AUDIO_UPDATE_VOLUME: {
            updateAudio(event.value.audioId, (audio: Audio) =>
              ({...audio, volume: event.value.volume})
            )
            break;
          }
          case BakuAction.AUDIO_UPDATE_DURATION: {
            updateAudio(event.value.audioId, (audio: Audio) =>
              ({...audio, duration: event.value.duration})
            )
            break;
          }
          case BakuAction.AUDIO_UPDATE_WAVEFORM: {
            updateAudio(event.value.audioId, (audio: Audio) =>
              ({...audio, waveform: event.value.waveform})
            )
            break;
          }
          case BakuAction.SOUNDTIMELINE_ADD: {
            const {audioId, start, end, pisteNumber, title} = event.value.params as { audioId: string, start: number, end : number; pisteNumber : number, title : String };
            soundsTimeline.push({
              id: event.value.soundTimelineId,
              audioId: audioId,
              start : start,
              end : end,
              pisteNumber : pisteNumber,
              title : title,
            });
            break;
          }
          case BakuAction.SOUNDTIMELINE_REMOVE: {
            const soundTimelineIndex = soundsTimeline.findIndex((soundTimeline) => soundTimeline.id === event.value.soundTimelineId);
            soundsTimeline.splice(soundTimelineIndex, 1);
            break;
          }
          case BakuAction.SOUNDTIMELINE_UPDATE_START: {
            updateSoundTimeline(event.value.soundTimelineId, (soundTimeline: SoundTimeline) =>
              ({...soundTimeline, start: event.value.start})
            )
            updateSoundTimeline(event.value.soundTimelineId, (soundTimeline: SoundTimeline) =>
              ({...soundTimeline, end: event.value.end})
            )
            break;
          }
          default:
            break;
        }
      });
      return {
        title, synopsis, poster, shots, audios, dataTimeline, soundsTimeline, fps, locked
      };
    }

  public static getPosterUrl(movie: Movie) {
    if (movie.poster) {
      return movie.poster.id;
    } else if (movie && movie.shots && movie.shots.length > 0 && movie.shots[0].images && movie.shots[0].images.length > 0) {
      return movie.shots[0].images[0].getUrl(Quality.Original);
    }
  }
  public static getAudio(movie:Movie, index: number) {
    return movie.audios[index];
  }
}
