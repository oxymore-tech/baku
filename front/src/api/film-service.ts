import {BakuAction, BakuEvent, BakuService} from "@/api/baku-service";
import uuid from "uuid";

export type ImageRef = string;

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

  private readonly bakuService: BakuService = new BakuService();

  public async get(id: string): Promise<Film> {
    const events = await this.bakuService.getHistory(id);
    return FilmService.merge(events);
  }

  public async updateTitle(projectId: string, title: string): Promise<void> {
    await this.bakuService.stack(projectId, {action: BakuAction.UPDATE_TITLE, value: title});
  }

  public async updateSynopsis(projectId: string, synopsis: string): Promise<void> {
    await this.bakuService.stack(projectId, {action: BakuAction.UPDATE_SYNOPSIS, value: synopsis});
  }

  public async updatePoster(projectId: string, poster: ImageRef): Promise<void> {
    await this.bakuService.stack(projectId, {action: BakuAction.UPDATE_SYNOPSIS, value: poster});
  }

  public async addPlan(projectId: string, name: string): Promise<void> {
    await this.bakuService.stack(projectId, {action: BakuAction.ADD_PLAN, value: name});
  }

  public async insertImage(projectId: string, image: ImageRef): Promise<void> {
    await this.bakuService.stack(projectId, {action: BakuAction.ADD_PLAN, value: image});
  }

  private static merge(events: BakuEvent[]): Film {
    let title = "Unnamed";
    let synopsis = "Please fill a synopsis";
    let poster;
    let plans: Plan[] = [];

    for (const event of events) {
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
        case BakuAction.ADD_PLAN:
          const {id, name} = event.value as { id: string, name: string };
          plans.push({id, name, images: []});
          break;
        case BakuAction.INSERT_IMAGE:
          const {planIndex, imageIndex, image} =
            event.value as { planIndex: number, imageIndex: number, image: ImageRef };
          const plan = plans[planIndex];
          if (!plan) {
            throw new Error(`Plan ${planIndex} should exist for project ${title}`);
          }
          plan.images.splice(imageIndex, 0, image);
          plans.splice(planIndex, 1, plan);
          break;
      }
    }

    if (plans.length == 0) {
      plans.push({id: uuid(), name: "Default plan", images: []});
    }
    return {title, synopsis, poster, plans};
  }
}
