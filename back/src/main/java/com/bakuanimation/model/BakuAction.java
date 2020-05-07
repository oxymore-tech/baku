package com.bakuanimation.model;

public enum BakuAction {
    MOVIE_UPDATE_TITLE,
    MOVIE_UPDATE_SYNOPSIS,
    MOVIE_UPDATE_POSTER,
    MOVIE_INSERT_IMAGE,
    SHOT_ADD,
    CHANGE_FPS,
    MOVIE_REMOVE_IMAGE,
    SHOT_REMOVE,
    MOVIE_LOCK,
    SHOT_LOCK,
    SHOT_UPDATE_SYNOPSIS,
    SHOT_UPDATE_STORYBOARD;

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
            case 8:
                return MOVIE_LOCK;
            case 9:
                return SHOT_LOCK;
            case 10:
                return SHOT_UPDATE_SYNOPSIS;
            case 11:
                return SHOT_UPDATE_STORYBOARD;
            default:
                throw new IllegalArgumentException();
        }
    }
}
