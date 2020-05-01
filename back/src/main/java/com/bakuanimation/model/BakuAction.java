package com.bakuanimation.api;

public enum BakuAction {
    MOVIE_UPDATE_TITLE,
    MOVIE_UPDATE_SYNOPSIS,
    MOVIE_UPDATE_POSTER,
    MOVIE_INSERT_IMAGE,
    SHOT_ADD,
    CHANGE_FPS,
    MOVIE_REMOVE_IMAGE,
    SHOT_REMOVE;

    public static BakuAction action(int value) {
        switch (value) {
            case 0:
                return MOVIE_UPDATE_TITLE;
            case 1:
                return MOVIE_UPDATE_SYNOPSIS;
            case 2:
                return MOVIE_UPDATE_POSTER;
            case 3:
                return MOVIE_INSERT_IMAGE;
            case 4:
                return SHOT_ADD;
            case 5:
                return CHANGE_FPS;
            case 6:
                return MOVIE_REMOVE_IMAGE;
            case 7:
                return SHOT_REMOVE;
            default:
                throw new IllegalArgumentException();
        }
    }
}
