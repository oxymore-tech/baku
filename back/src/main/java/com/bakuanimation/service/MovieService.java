package com.bakuanimation.service;

import com.bakuanimation.api.Movie;
import com.bakuanimation.api.MovieStatus;
import com.bakuanimation.api.VideoState;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Stopwatch;
import com.google.common.collect.Sets;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Singleton
public final class MovieService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MovieService.class);

    private final HistoryService historyService;
    private final PathService pathService;

    private final Set<String> pendingMovieGeneration = Sets.newConcurrentHashSet();

    public MovieService(HistoryService historyService, PathService pathService) {
        this.historyService = historyService;
        this.pathService = pathService;
    }

    // Check last modified time of movie and stack file
    // if not the same -> will generate a movie & lock in memory the generation
    // The goal is for this method to be called many time on the same project id, and the movie will only be generated once
    public Single<VideoState> generateMovie(String projectId) {
        return historyService.interpretHistory(projectId)
                .map(movie -> {
                    Path moviePath = pathService.getMovieFile(projectId);
                    Path movieTempPath = pathService.getMovieTempFile(projectId);
                    Instant lastModifiedStackFile = Files.getLastModifiedTime(pathService.getStackFile(projectId)).toInstant();
                    boolean exists = Files.exists(moviePath);
                    if (!exists ||
                            lastModifiedStackFile.isAfter(Files.getLastModifiedTime(moviePath).toInstant())) {
                        if (!pendingMovieGeneration.add(projectId)) {
                            // if the pending task already contain the project id, it means the movie is already being generated
                            LOGGER.debug("Movie {} ({}) is being generated", movie.getName(), moviePath);
                            return VideoState.Pending;
                        }
                        generateMovie_ffmpeg(movie, movieTempPath)
                                .doAfterTerminate(() -> pendingMovieGeneration.remove(projectId))
                                .subscribe(s -> {
                                    LOGGER.debug("Movie {} ({}) ready", movie.getName(), moviePath);
                                    Files.setLastModifiedTime(movieTempPath, FileTime.from(lastModifiedStackFile));
                                    Files.move(movieTempPath, moviePath, StandardCopyOption.REPLACE_EXISTING);
                                }, err -> LOGGER.warn("Error while generating movie {} ({})", movie.getName(), moviePath, err));

                        return exists ? VideoState.NotUpToDate : VideoState.NotGenerated;
                    } else {
                        LOGGER.debug("Movie {} ({}) exist and is up-to-date, it can be downloaded", movie.getName(), moviePath);
                        return VideoState.UpToDate;
                    }
                });
    }

    @VisibleForTesting
    public Single<Boolean> generateMovie_ffmpeg(Movie movie, Path moviePath) {
        return Single.fromCallable(() -> {
            LOGGER.info("Generating movie '{}'", moviePath.toAbsolutePath());
            Files.createDirectories(moviePath.getParent());

            Stopwatch timer = Stopwatch.createStarted();

            String command = "ffmpeg -r " +
                    movie.getFps() +
                    " -f image2pipe -y -i - " +
                    moviePath;
            Process proc = Runtime.getRuntime().exec(command);


            BufferedReader stdInput = new BufferedReader(new
                    InputStreamReader(proc.getInputStream()));
            BufferedReader stdError = new BufferedReader(new
                    InputStreamReader(proc.getErrorStream()));
            try {
                try (OutputStream os = proc.getOutputStream()) {
                    for (String shot : movie.getShots()) {
                        for (Path img : movie.getImages().get(shot)) {
                            LOGGER.debug("copying shot {}, {}", shot, img);
                            Files.copy(img, os);
                        }
                    }
                }
                proc.waitFor();
                LOGGER.info("Generated movie '{}' in {}s", moviePath, timer.elapsed(TimeUnit.SECONDS));
                return true;
            } finally {
                String stderr = IOUtils.toString(stdInput);
                String stdout = IOUtils.toString(stdError);

                if (!stdout.isBlank()) {
                    LOGGER.debug(stdout);
                }
                if (!stderr.isBlank()) {
                    LOGGER.warn("Error with command {} : {}", moviePath, stderr);
                }
            }

        }).subscribeOn(Schedulers.io());
    }

    public Single<MovieStatus> status(String projectId) {
        return Single.fromCallable(() -> {
            if (pendingMovieGeneration.contains(projectId)) {
                return new MovieStatus(VideoState.Pending, Instant.EPOCH);
            }
            Path movieFile = pathService.getMovieFile(projectId);
            if (Files.exists(movieFile)) {
                Instant lastModifiedMovie = Files.getLastModifiedTime(movieFile).toInstant();
                Instant lastModifiedStack = Files.getLastModifiedTime(pathService.getStackFile(projectId)).toInstant();
                if (lastModifiedMovie.isBefore(lastModifiedStack)) {
                    return new MovieStatus(VideoState.NotUpToDate, lastModifiedMovie);
                } else {
                    return new MovieStatus(VideoState.UpToDate, lastModifiedMovie);
                }
            } else {
                return new MovieStatus(VideoState.NotGenerated, Instant.EPOCH);
            }
        }).subscribeOn(Schedulers.io());
    }
}
