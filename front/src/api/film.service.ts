import * as uuid from 'uuid';
import {
  BakuAction, BakuEvent, BakuService, ImageRef,
} from '@/api/baku.service';

export interface Film {
  readonly title: string;
  readonly synopsis: string;
  readonly poster?: ImageRef;
  readonly plans: Plan[];
}

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly images: ImageRef[];
}

export class FilmService {
  public static merge(events: BakuEvent[]): Film {
    let title = 'Unnamed';
    let synopsis = 'Please fill a synopsis';
    let poster;
    const plans: Plan[] = [];

    events.forEach((event) => {
      switch (event.action) {
        case BakuAction.UPDATE_TITLE:
          title = event.value;
          break;
        case BakuAction.UPDATE_SYNOPSIS:
          synopsis = event.value;
          break;
        case BakuAction.UPDATE_POSTER:
          poster = event.value;
          break;
        case BakuAction.ADD_PLAN: {
          const { id, name } = event.value as { id: string, name: string };
          plans.push({ id, name, images: [] });
          break;
        }
        case BakuAction.INSERT_IMAGE: {
          const { planId, imageIndex, image } = event.value as { planId: string, imageIndex: number, image: ImageRef };
          const plan = plans.find((p) => p.id === planId);
          const planIndex = plans.findIndex((p) => p.id === planId);
          if (!plan) {
            throw new Error(`Plan ${planId} should exist for project ${title}`);
          }
          plan.images.splice(imageIndex, 0, image);
          plans.splice(planIndex, 1, plan);
          break;
        }
        default:
          break;
      }
    });
    return {
      title, synopsis, poster, plans,
    };
  }

  private readonly bakuService: BakuService = new BakuService();

  public async get(id: string): Promise<Film> {
    const events = await this.bakuService.getHistory(id);
    return FilmService.merge(events);
  }

  public async getHistory(id: string): Promise<BakuEvent[]> {
    return this.bakuService.getHistory(id);
  }

  public async updateTitle(projectId: string, title: string, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_TITLE, value: title, user: username  });
  }

  public async updateSynopsis(projectId: string, synopsis: string, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_SYNOPSIS, value: synopsis, user: username  });
  }

  public async updatePoster(projectId: string, poster: ImageRef, username: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_SYNOPSIS, value: poster,user: username  });
  }

  public async addPlan(projectId: string, name: string, username: string): Promise<BakuEvent> {
    const event: BakuEvent = { action: BakuAction.ADD_PLAN, value: { id: uuid.v4(), name }, user: username };
    await this.bakuService.stack(projectId, event);
    return event;
  }

  public async insertImage(projectId: string, planId: string, imgIndex: number, image: ImageRef, username: string): Promise<BakuEvent> {
    const event: BakuEvent = {
      action: BakuAction.INSERT_IMAGE,
      value: { planId, imageIndex: imgIndex, image },
      user: username
    };
    await this.bakuService.stack(projectId, event);
    return event;
  }
}
