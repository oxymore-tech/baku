package com.bakuanimation.api;

import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import io.reactivex.Single;

import javax.annotation.Nullable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public interface SoundService {
    public void save(String projectId, InputStream inputStream, String filename);

    public void delete(String projectId, String filename);
}
