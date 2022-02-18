package com.bakuanimation.api;

import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import io.reactivex.Single;

import javax.annotation.Nullable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;


public interface TTSService {

    public void generateWav(String input, String voice, String projectId, String filename);

    //public void getWav(String projectId, String wavId);
}
