package com.bakuanimation.rest;

import com.bakuanimation.api.ImageService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.api.SoundService;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.PathService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.multipart.StreamingFileUpload;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.http.server.types.files.SystemFile;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.*;
import java.nio.file.Files;

@Controller
public class TTSController {

    private static final Logger LOGGER = LoggerFactory.getLogger(SoundController.class);

    private final HistoryServiceImpl historyService;
    private final SoundService soundService;
    private final PathService pathService;
    private final PermissionService permissionService;

    public TTSController(HistoryServiceImpl historyService, ImageService imageService,
                           PathService pathService, PermissionService permissionService, TTSService ttsService) {
        this.historyService = historyService;
        this.ttsService = ttsService;
        this.pathService = pathService;
        this.permissionService = permissionService;
    }

    @Post(value = "/api/{projectId}/saveWav", consumes = MediaType.APPLICATION_JSON)
    public HttpResponse<?> saveWav(){
        this.ttsService.generateVoice("Ceci est un test","test","upmc-pierre-hsmm");
        return HttpResponse.status(HttpStatus.CREATED).body(new Message(HttpStatus.getCode(),"Saved Successfully !"));
    }


    @Get("\"/api/{projectId}/getWav\"")
    public HttpResponse<Object> getWav() {
        return HttpResponse.ok(new SystemFile("/tts/test/save".toFile()).attach("test"));
        
    }


}