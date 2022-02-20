package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.api.TTSService;
import com.bakuanimation.model.TTSdata;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.PathService;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;

import java.nio.file.Files;
import java.nio.file.Path;

import marytts.exceptions.MaryConfigurationException;

@Controller
public class TTSController {

    private final HistoryServiceImpl historyService;
    private final PathService pathService;
    private final PermissionService permissionService;
    private final TTSService ttsService;

    /* Constructeur */
    public TTSController(HistoryServiceImpl historyService, PathService pathService,
                         PermissionService permissionService, TTSService ttsService) {

        this.historyService = historyService;
        this.ttsService = ttsService;
        this.pathService = pathService;
        this.permissionService = permissionService;
    }

    @Post("/api/{projectId}/saveWav")
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<Object> saveWav(@PathVariable String projectId, @Body TTSdata data) {

        /* Génération du fichier wav*/
        String id = permissionService.getProject(projectId).getId();
        this.ttsService.generateWav(data.getText(), data.getVoice(), id, data.getFileName());

        /* Vérification */
        Path path = this.pathService.getWavFile(id, data.getFileName() + ".wav");
        if (Files.exists(path)) return HttpResponse.status(HttpStatus.OK).body(path);
        System.out.println("No file at " + path.toString());
        return HttpResponse.status(HttpStatus.NO_RESPONSE).body("Failed to create wav file");

    }




}