package com.bakuanimation.service;

import com.bakuanimation.api.Movie;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableListMultimap;
import com.google.common.collect.ListMultimap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Disabled
class MovieServiceImplTest {
    @TempDir
    static Path sharedTempDir;

    private MovieServiceImpl tested;
    private HistoryServiceImpl historyService;

    @BeforeEach
    void setUp() {
        PermissionServiceImpl permissionService = mock(PermissionServiceImpl.class);
        when(permissionService.hasRight(any(), any())).thenReturn(true);
        historyService = new HistoryServiceImpl(new PathService(Path.of("/home/simon/workspace-perso/data")), permissionService);
        tested = new MovieServiceImpl(historyService, new PathService(sharedTempDir));
    }

    @Test
    void shoudGenerateMovie(){
        ImmutableListMultimap.Builder<String, Path> builder = ImmutableListMultimap.<String, Path>builder();
        for (int i = 0; i < 100; i++) {
            builder.put("a", Path.of("/home/simon/workspace-perso/data/68c1bdf4-66f6-4998-99db-a3df18986707/images/original/5f05cf5a-35e7-4221-ba31-758c42d3aa94.jpg"))
                    .put("a", Path.of("/home/simon/workspace-perso/data/68c1bdf4-66f6-4998-99db-a3df18986707/images/original/7f9a11a8-da4f-4493-a015-608c7b6cc1da.jpg"));
        }
        ListMultimap<String, Path> images = builder
                .build();
        Movie movie = new Movie("", "", "", 12, ImmutableList.of("a"),
                images);
        tested.generateMovie_ffmpeg(movie, Path.of("/tmp/test-movie/test_movie.mp4")).blockingGet();
    }

    @Test
    void moviePremier() {
        String projectId = "premier";
        Movie movie = historyService.interpretHistory("ba6f85c2-32f0-4b41-a395-bbe913b042f3").blockingGet();

        int nbShots = 3;
        List<String> shots = movie.getShots().stream()
                .limit(nbShots)
                .collect(Collectors.toList());
        Movie newMovie = new Movie(movie.getProjectId(), movie.getName(), movie.getSynopsis(), movie.getFps(), shots, movie.getImages());

        tested.generateMovie_ffmpeg(newMovie, Path.of("/tmp/test-movie/test_premier.mp4")).blockingGet();
    }
}