export enum BakuAction {
    UPDATE_TITLE,
    UPDATE_SYNOPSIS,
    UPDATE_POSTER,
    ADD_PLAN,
    INSERT_IMAGE
}

export interface BakuEvent {
    readonly action: BakuAction;
    readonly value: any;
}

export class BakuService {

    upload(projectId: string, id: string, blob: Blob, name: string) {

    }

    getHistory(projectId: string): Promise<BakuEvent[]> {
        return null;
    }

    stack(projectId: string, event: BakuEvent) {

    }

}