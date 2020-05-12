package com.bakuanimation.model;

import java.time.Instant;

public final class MovieStatus {

    private final VideoState status;
    private final Instant lastModified;

    public MovieStatus(VideoState status, Instant lastModified) {
        this.status = status;
        this.lastModified = lastModified;
    }

    public VideoState getStatus() {
        return status;
    }

    public Instant getLastModified() {
        return lastModified;
    }
}
