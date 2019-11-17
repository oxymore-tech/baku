export enum BakuAction {
    UPDATE_TITLE,
    UPDATE_SYNOPSIS,
    UPDATE_POSTER,
    ADD_PLAN,
    INSERT_IMAGE,
}

export interface BakuEvent {
    readonly action: BakuAction;
    readonly value: any;
}

export class BakuService {

    public upload(projectId: string, id: string, blob: Blob, name: string) {

    }

    public getHistory(projectId: string): Promise<BakuEvent[]> {
        return new Promise((resolve, reject) => []);
    }

    public stack(projectId: string, event: BakuEvent): Promise<void> {
        return new Promise((resolve, reject) => {});
    }

}
