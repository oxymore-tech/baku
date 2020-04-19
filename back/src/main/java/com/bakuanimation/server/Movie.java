package com.bakuanimation.server;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableListMultimap;
import com.google.common.collect.ListMultimap;

import java.nio.file.Path;
import java.util.List;

public final class Movie {
    private final String projectId;
    private final String name;
    private final String synopsis;
    private final int fps;
    private final ImmutableList<String> shots;
    private final ImmutableListMultimap<String, Path> images;

    public Movie(String projectId, String name, String synopsis, int fps, List<String> shots, ListMultimap<String, Path> images) {
        this.shots = ImmutableList.copyOf(shots);
        this.images = ImmutableListMultimap.copyOf(images);
        this.projectId = projectId;
        this.name = name;
        this.synopsis = synopsis;
        this.fps = fps;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getName() {
        return name;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public int getFps() {
        return fps;
    }

    public ImmutableList<String> getShots() {
        return shots;
    }

    public ImmutableListMultimap<String, Path> getImages() {
        return images;
    }
}
