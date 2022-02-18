package com.bakuanimation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Singleton
public class PathService {

    public static final Logger LOGGER = LoggerFactory.getLogger(PathService.class);
    private static final String DELETE_PREFIX = "delete_";

    private final Path dataPath;

    public PathService() {
        this(Paths.get("data"));
    }

    public PathService(Path dataPath) {
        this.dataPath = dataPath;
        LOGGER.info("Data path : {}", dataPath.toAbsolutePath());
    }

    public Path projectDir(String projectId) {
        return dataPath
                .resolve(projectId);
    }

    public Path deletePath(String projectId) {
        Path path = projectDir(projectId);
        return path.getParent().resolve(DELETE_PREFIX + path.getFileName().toString());
    }

    public List<Path> toDeleteProject() throws IOException {
        if (!Files.isDirectory(dataPath)) {
            return List.of();
        }
        return Files.list(dataPath)
                .filter(p -> p.getFileName().toString().startsWith(DELETE_PREFIX))
                .collect(Collectors.toUnmodifiableList());
    }

    public void createDirectory(String projectId) throws IOException {
        Files.createDirectories(this.projectDir(projectId));
    }

    public Path getStackFile(String projectId) {
        return this
                .projectDir(projectId)
                .resolve("stack.json");
    }

    public Path getMovieFile(String projectId) {
        return this
                .projectDir(projectId)
                .resolve("movie.mp4");
    }

    public Path getMovieFile(String projectId, String shotId) {
        return this
                .projectDir(projectId)
                .resolve("movie_" + shotId + ".mp4");
    }

    public Path getMovieTempFile(String projectId) {
        return this
                .projectDir(projectId)
                .resolve("movie.tmp.mp4");
    }

    public Path getMovieTempFile(String projectId, String shotId) {
        return this
                .projectDir(projectId)
                .resolve("movie_" + shotId + ".tmp.mp4");
    }

    public Path getStackTempFile(String projectId) {
        return this
                .projectDir(projectId)
                .resolve("stack.json.tmp");
    }

    public Path getImageFile(String projectId, String imageType, String imageId) {
        return this
                .projectDir(projectId)
                .resolve("images")
                .resolve(imageType)
                .resolve(imageId);
    }
    
    public Path getSoundFile(String projectId, String soundId) {
        return this
            .projectDir(projectId)
            .resolve("sounds")
            .resolve(soundId);
    }

    public Path getWavFile(String projectId, String soundId) {
        return this
                .projectDir(projectId)
                .resolve("wav")
                .resolve(soundId);
    }
}
