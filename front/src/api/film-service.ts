import { BakuAction, BakuEvent, BakuService } from "@/api/baku-service";
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
    return FilmService.merge(events, id);
  }

  public async getHistory(id: string): Promise<BakuEvent[]> {
    return await this.bakuService.getHistory(id);
  }

  public async updateTitle(projectId: string, title: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_TITLE, value: title });
  }

  public async updateSynopsis(projectId: string, synopsis: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_SYNOPSIS, value: synopsis });
  }

  public async updatePoster(projectId: string, poster: ImageRef): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.UPDATE_SYNOPSIS, value: poster });
  }

  public async addPlan(projectId: string, name: string): Promise<void> {
    await this.bakuService.stack(projectId, { action: BakuAction.ADD_PLAN, value: name });
  }

  public async insertImage(projectId: string, planId: string, imgIndex: number, image: ImageRef): Promise<BakuEvent> {
    await this.bakuService.stack(projectId, { action: BakuAction.INSERT_IMAGE, value: { planId: planId, imageIndex: imgIndex, image: image } });
    return { action: BakuAction.INSERT_IMAGE, value: { planId: planId, imageIndex: imgIndex, image: image }};
  }

  public static merge(events: BakuEvent[], projectId: string): Film {
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
          const { id, name } = event.value as { id: string, name: string };
          plans.push({ id, name, images: [] });
          break;
        case BakuAction.INSERT_IMAGE:
          const { planId, imageIndex, image } =
            event.value as { planId: string, imageIndex: number, image: ImageRef };
          const plan = plans.find(plan => plan.id === planId);
          const planIndex = plans.findIndex(plan => plan.id === planId);
          if (!plan) {
            throw new Error(`Plan ${planId} should exist for project ${title}`);
          }
          plan.images.splice(imageIndex, 0, image);
          plans.splice(planIndex, 1, plan);
          break;
      }
    }

    if (plans.length == 0) {
      plans.push({ id: uuid(), name: "Default plan", images: [] });
      new BakuService().stack(projectId, { action: BakuAction.ADD_PLAN, value: { id: plans[0].id, name: plans[0].name} });
    }
    return { title, synopsis, poster, plans };
  }
}
