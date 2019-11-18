import axios from "axios";

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

    private static readonly BaseUrl = "https://localhost:3030";

    public upload(projectId: string, id: string, blob: Blob, name: string) {
        return axios
            .post(`${BakuService.BaseUrl}/${projectId}/upload/${id}`, blob);
    }

    public getHistory(projectId: string): Promise<BakuEvent[]> {
        return axios
            .get(`${BakuService.BaseUrl}/${projectId}/history`)
            .then((response) => response.data);
    }

    public stack(projectId: string, event: BakuEvent): Promise<void> {
        return axios
            .post(`${BakuService.BaseUrl}/${projectId}/stack`, event);
    }

}
