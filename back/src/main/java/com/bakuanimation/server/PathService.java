package com.bakuanimation.server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.nio.file.Path;
import java.nio.file.Paths;

@Singleton
public class PathService {

    public static final Logger LOGGER = LoggerFactory.getLogger(PathService.class);

    private final Path dataPath;

    public PathService() {
        dataPath = Paths.get("data");
        LOGGER.info("Data path : {}", dataPath);
    }

    Path stackDirectory() {
        return dataPath.resolve("stacks");
    }

    public Path imagePath() {
        return dataPath.resolve("images");
    }
}
