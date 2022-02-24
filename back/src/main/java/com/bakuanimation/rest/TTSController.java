package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.api.TTSService;
import com.bakuanimation.model.TTSdata;
import com.bakuanimation.model.TTSResponse;
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

import java.io.File;
import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.Path;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;

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
    public TTSResponse saveWav(@PathVariable String projectId, @Body TTSdata data) {

        /* Génération du fichier wav*/
        String id = permissionService.getProject(projectId).getId();
        this.ttsService.generateWav(data.getText(), data.getVoice(), id, data.getFileName(), data.getVoiceRate());

        /* Vérification */
        Path path = this.pathService.getSoundFile(id, data.getFileName());
        if (Files.exists(path)) {

            /* Calcul de la durée */
            File file = new File(path.toString());
            AudioInputStream audioInputStream = null;
            try {
                audioInputStream = AudioSystem.getAudioInputStream(file);
            } catch (UnsupportedAudioFileException e1) {
                System.err.println("Error in AUDIO_ADD_WAV : " + e1);
                System.exit(1);
            } catch (IOException e2) {
                System.err.println("Error in AUDIO_ADD_WAV : " + e2);
                System.exit(1);
            }
            AudioFormat format = audioInputStream.getFormat();
            long frames = audioInputStream.getFrameLength();
            double duration = (frames+0.0) / format.getFrameRate();
            return new TTSResponse(path.toString(), duration);

        }
        System.out.println("No file at " + path.toString());
        return new TTSResponse("Error when creating an audio", 0);

    }




}