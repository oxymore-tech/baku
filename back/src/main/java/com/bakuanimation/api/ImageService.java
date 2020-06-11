package com.bakuanimation.api;

import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import io.reactivex.Single;

import javax.annotation.Nullable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public interface ImageService {
    void writeSmallerImages(String projectId, InputStream inputStream, String filename);

    long estimatedExportSize(Movie movie, @Nullable String shotId);

    void export(Movie movie, OutputStream outputStream, @Nullable String shotId) throws IOException;

    Single<Project> importMovie(String projectName);
}
