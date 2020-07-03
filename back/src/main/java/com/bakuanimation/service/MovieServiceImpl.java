package com.bakuanimation.service;

import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.MovieService;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.MovieStatus;
import com.bakuanimation.model.VideoState;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Stopwatch;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import io.reactivex.Scheduler;
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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Singleton
public final class MovieServiceImpl implements MovieService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MovieServiceImpl.class);

    private final HistoryService historyService;
    private final PathService pathService;

    private final Scheduler movieGenerationScheduler;
    private final Set<String> pendingMovieGeneration = Sets.newConcurrentHashSet();
    private final Map<String, Single<Path>> pendingMoviePlanGeneration = Maps.newConcurrentMap();

    public MovieServiceImpl(HistoryService historyService, PathService pathService) {
        this.historyService = historyService;
        this.pathService = pathService;
        this.movieGenerationScheduler = Schedulers.from(Executors.newSingleThreadExecutor());
    }

    // Check last modified time of movie and stack file
    // if not the same -> will generate a movie & lock in memory the generation
    // The goal is for this method to be called many time on the same project id, and the movie will only be generated once
    @Override
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
                        generateMovie_ffmpeg(movie, movieTempPath, moviePath, FileTime.from(lastModifiedStackFile))
                                .doAfterTerminate(() -> pendingMovieGeneration.remove(projectId))
                                .subscribe(s -> {
                                        },
                                        err -> LOGGER.warn("Error while generating movie {} ({})", movie.getName(), moviePath, err));

                        return exists ? VideoState.NotUpToDate : VideoState.NotGenerated;
                    } else {
                        LOGGER.debug("Movie {} ({}) exist and is up-to-date, it can be downloaded", movie.getName(), moviePath);
                        return VideoState.UpToDate;
                    }
                });
    }

    // Check last modified time of movie and stack file
    // if not the same -> will generate a movie & lock in memory the generation
    // The goal is for this method to be called many time on the same project id, and the movie plan will only be generated once
    @Override
    public Single<Path> generatePlan(String projectId, String shotId) {
        return historyService.interpretHistory(projectId)
                .flatMap(wholeMovie -> {
                    int shotIdx = wholeMovie.getShots().indexOf(shotId);
                    if (shotIdx == -1) {
                        return Single.error(new IllegalArgumentException("Shot " + shotId + " not found"));
                    }
                    Movie movie = new Movie(wholeMovie.getProjectId(), wholeMovie.getName(), wholeMovie.getSynopsis(), wholeMovie.getFps(), wholeMovie.isLocked(),
                            wholeMovie.getLockedShots(), List.of(shotId), wholeMovie.getImages());
                    Path moviePath = pathService.getMovieFile(projectId, String.valueOf(shotIdx));
                    Path movieTempPath = pathService.getMovieTempFile(projectId, String.valueOf(shotIdx));
                    Instant lastModifiedStackFile = Files.getLastModifiedTime(pathService.getStackFile(projectId)).toInstant();
                    if (!Files.exists(moviePath) ||
                            lastModifiedStackFile.isAfter(Files.getLastModifiedTime(moviePath).toInstant())) {
                        return pendingMoviePlanGeneration.computeIfAbsent(moviePath.getFileName().toString(), k -> {
                            // The point is to generate once a movie plan, and if other request the same movie plan while it's generating
                            // it will also wait for the movie to be done generating and will return the same path once it's done
                            return generateMovie_ffmpeg(movie, movieTempPath, moviePath, FileTime.from(lastModifiedStackFile))
                                    .map(v -> moviePath)
                                    .doAfterTerminate(() -> pendingMoviePlanGeneration.remove(moviePath.getFileName().toString()))
                                    .cache(); // without cache, the Single will be subscribed each time the cache is reached (that would mean another movie generation)
                        });
                    } else {
                        LOGGER.debug("Movie {} ({}) exist and is up-to-date, it can be downloaded", movie.getName(), moviePath);
                        return Single.just(moviePath);
                    }
                });
    }

    private Single<Boolean> generateMovie_ffmpeg(Movie movie, Path movieTempPath, Path moviePath, FileTime fileTime) {
        return generateMovie_ffmpeg(movie, movieTempPath)
                .doOnSuccess(v -> {
                    Files.setLastModifiedTime(movieTempPath, fileTime);
                    Files.move(movieTempPath, moviePath, StandardCopyOption.REPLACE_EXISTING);
                });
    }

    @VisibleForTesting
    Single<Boolean> generateMovie_ffmpeg(Movie movie, Path moviePath) {
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

        }).subscribeOn(movieGenerationScheduler);
    }

    @Override
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
