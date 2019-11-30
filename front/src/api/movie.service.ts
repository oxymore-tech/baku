import * as uuid from 'uuid';
import {
  BakuAction, BakuEvent, BakuService, ImageRef,
} from '@/api/baku.service';

export interface Movie {
  readonly title: string;
  readonly synopsis: string;
  readonly poster?: ImageRef;
  readonly shots: Shot[];
}

export interface Shot {
  readonly id: string;
  readonly name: string;
  readonly images: ImageRef[];
}

export class MovieService {

  public static merge(events: BakuEvent[]): Movie {
    let title = 'Unnamed';
    let synopsis = 'Please fill a synopsis';
    let poster;
    const shots: Shot[] = [];

    const updateShot = function(shotId: string, updateFn: (shot: Shot) => Shot) {
      const shotIndex = shots.findIndex(p => p.id === shotId);
      const shot = shots.find((p) => p.id === shotId);
      if (!shot) {
        throw new Error(`shot ${shotId} should exist for project ${title}`);
      }
      shots.splice(shotIndex, 1, updateFn(shot));
    }

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
          const { shotId, imageIndex, image } = event.value as { shotId: string, imageIndex: number, image: ImageRef };
          updateShot(shotId, (shot: Shot) => {
            return {
              id: shot.id,
              name: shot.name,
              images: shot.images.splice(imageIndex, 0, image),
            }
          });
          break;
        }
        case BakuAction.SHOT_ADD: {
          const { shotId, name } = event.value as { shotId: string, name: string };
          shots.push({ id: shotId, name, images: [] });
          break;
        }
        case BakuAction.SHOT_RENAME: {
          const { shotId, name } = event.value as { shotId: string, name: string };
          updateShot(shotId, (shot: Shot) => {
            return {
              id: shot.id,
              name,
              images: shot.images,
            }
          });
          break;
        }
        default:
          break;
      }
    });
    return {
      title, synopsis, poster, shots,
    };
  }

  private readonly bakuService: BakuService = new BakuService();

  public async get(id: string): Promise<Movie> {
    const events = await this.bakuService.getHistory(id);
    return MovieService.merge(events);
  }

  public async getHistory(id: string): Promise<BakuEvent[]> {
    return this.bakuService.getHistory(id);
  }

  public async updateTitle(projectId: string, title: string, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.MOVIE_UPDATE_TITLE, value: title, user: username  });
  }

  public async updateSynopsis(projectId: string, synopsis: string, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.MOVIE_UPDATE_SYNOPSIS, value: synopsis, user: username  });
  }

  public async updatePoster(projectId: string, poster: ImageRef, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.MOVIE_UPDATE_SYNOPSIS, value: poster,user: username  });
  }

  public async addShot(projectId: string, name: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = { action: BakuAction.SHOT_ADD, value: { shotId: uuid.v4(), name }, user: username };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async renameShot(projectId: string, shotId: string, name: string, username: string): Promise<BakuEvent> {
    const event = {
      action: BakuAction.SHOT_RENAME,
      value: { shotId, name },
      user: username,
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async insertImage(projectId: string, shotId: string, imgIndex: number, image: ImageRef, username: string): Promise<BakuEvent> {
    const event: BakuEvent = {
      action: BakuAction.MOVIE_INSERT_IMAGE,
      value: { shotId, imageIndex: imgIndex, image },
      user: username,
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }
}
