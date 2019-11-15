import {BakuAction, BakuEvent, BakuService} from "@/api/baku-service";
import {Film, ImageRef, Plan} from "@/api/film";
import {List} from "immutable";

export class FilmService {

    private readonly bakuService: BakuService = new BakuService();

    async get(id: string): Promise<Film> {
        const events = await this.bakuService.getHistory(id);
        return this.merge(events);
    }

    private merge(events: BakuEvent[]): Film {
        let title = "Unnamed";
        let synopsis = "Please fill a synopsis";
        let poster = undefined;
        let plans: List<Plan> = List();

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
                    plans.push({name: event.value, images: List()});
                    break;
                case BakuAction.INSERT_IMAGE:
                    const {planIndex, imageIndex, image} = event.value as { planIndex: number, imageIndex: number, image: ImageRef };
                    const plan = plans.get(planIndex);
                    if (!plan) {
                        throw new Error(`Plan ${planIndex} should exist for project ${title}`);
                    }
                    const images = plan.images.splice(imageIndex, 0, image);
                    plans.splice(planIndex, 1, {...plan, images});
                    break;
            }
        }

        return {title, synopsis, poster, plans};
    }

}