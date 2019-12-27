import * as uuid from 'uuid';
import {
  BakuAction, BakuEvent, BakuService,
} from '@/api/baku.service';
import { ImageRef, UploadedImage } from './uploadedImage.class';

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

  private readonly bakuService: BakuService = new BakuService();

  public async get(id: string): Promise<Movie> {
    const events = await this.bakuService.getHistory(id);
    console.log('events', events);
    return MovieService.merge(id, events);
  }

  public async getHistory(id: string): Promise<BakuEvent[]> {
    return this.bakuService.getHistory(id);
  }

  public async updateTitle(projectId: string, title: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = { action: BakuAction.MOVIE_UPDATE_TITLE, value: title, user: username };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async updateSynopsis(projectId: string, synopsis: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = {
      action: BakuAction.MOVIE_UPDATE_SYNOPSIS,
      value: synopsis,
      user: username,
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async updatePoster(projectId: string, poster: ImageRef, username: string): Promise<void> {
    await this.bakuService.stack(projectId, {
      action: BakuAction.MOVIE_UPDATE_SYNOPSIS,
      value: poster,
      user: username,
    });
  }

  public async addShot(projectId: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = {
      action: BakuAction.SHOT_ADD,
      value: { shotId: uuid.v4() },
      user: username,
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async changeFps(projectId: string, fps: number, username: string): Promise<BakuEvent> {
    const event = { action: BakuAction.CHANGE_FPS, value: fps, user: username };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async insertImage(projectId: string, shotId: string, imgIndex: number, image: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = {
      action: BakuAction.MOVIE_INSERT_IMAGE,
      value: { shotId, imageIndex: imgIndex, image },
      user: username,
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }
}
