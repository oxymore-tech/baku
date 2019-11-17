import {List} from 'immutable';

export type ImageRef = string;

export interface Film {
    readonly title: string;
    readonly synopsis: string;
    readonly poster?: ImageRef;
    readonly plans: List<Plan>;
}

export interface Plan {
    readonly name: string;
    readonly images: List<ImageRef>;
}
