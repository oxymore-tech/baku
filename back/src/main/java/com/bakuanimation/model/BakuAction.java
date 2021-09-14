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
    DELETE_MOVIE,
    SHOT_MOVE,
    AUDIO_ADD,
    AUDIO_REMOVE,
    AUDIO_UPDATE_TITLE,
    AUDIO_UPDATE_SOUND,
    AUDIO_UPDATE_VOLUME,
    AUDIO_UPDATE_DURATION,
    AUDIO_UPDATE_WAVEFORM,
    SOUNDTIMELINE_ADD,
    SOUNDTIMELINE_REMOVE,
    SOUNDTIMELINE_UPDATE_START;

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
