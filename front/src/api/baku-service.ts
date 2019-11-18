import * as request from 'request-promise-native';

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
        let events: BakuEvent[];
        (async () => {
          const options = {
              uri: '/' + projectId + '/history',
              json: true,
          };
          await request.get(options).then((results) => { events = results; });
        })();
        return new Promise( (resolve) => events);
    }

    public stack(projectId: string, event: BakuEvent): Promise<void> {
        return new Promise((resolve, reject) => {});
    }

}
