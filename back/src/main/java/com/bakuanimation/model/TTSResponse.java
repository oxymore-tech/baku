package com.bakuanimation.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class TTSResponse {

    private final String path;
    private final double duration;

    @JsonCreator
    public TTSResponse( @JsonProperty("path") String path,
                        @JsonProperty("duration") double duration) {

        this.path = path;
        this.duration = duration;
    }

    public String getPath() {
        return path;
    }

    public double getDuration() {
        return duration;
    }
}