import axios from 'axios';

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
        return axios
          .post('https://localhost:3030/' + projectId + '/upload/' + id, event);
    }

    public getHistory(projectId: string): Promise<BakuEvent[]> {
        return axios
          .get('https://localhost:3030/' + projectId + '/history')
          .then(response => response.data);
    }

    public stack(projectId: string, event: BakuEvent): Promise<void> {
        return axios
          .post('https://localhost:3030/' + projectId + '/stack', event);
    }

}
