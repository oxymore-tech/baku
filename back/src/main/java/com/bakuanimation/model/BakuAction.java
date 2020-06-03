package com.bakuanimation.model;

import com.google.common.collect.Maps;

import java.util.Map;
import java.util.Optional;

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
    SHOT_UPDATE_STORYBOARD,
    MOVIE_REVERSE_IMAGES,
    DELETE_MOVIE;

    private static final Map<Integer, BakuAction> lookup = Maps.newHashMap();

    static
    {
        for (int i = 0; i < BakuAction.values().length; i++) {
            lookup.put(i, BakuAction.values()[i]);
        }
    }

    public static BakuAction action(int value) {
        return Optional.ofNullable(lookup.get(value))
                .orElseThrow(IllegalArgumentException::new);
    }
}
