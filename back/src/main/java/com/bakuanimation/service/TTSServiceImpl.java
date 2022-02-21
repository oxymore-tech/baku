package com.bakuanimation.service;

import com.bakuanimation.api.TTSService;
import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.service.PathService;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import javax.inject.Singleton;
import javax.sound.sampled.AudioInputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import marytts.MaryInterface;
import marytts.LocalMaryInterface;
import marytts.exceptions.MaryConfigurationException;
import marytts.exceptions.SynthesisException;
import marytts.util.data.audio.MaryAudioUtils;


@Singleton
public class TTSServiceImpl implements TTSService{

    private static final Logger LOGGER = LoggerFactory.getLogger(TTSServiceImpl.class);

    private final PathService pathService;
    private final HistoryService historyService;
    private final PermissionService permissionService;

    public TTSServiceImpl(PathService pathService, HistoryService historyService, PermissionService permissionService) {
        this.pathService = pathService;
        this.historyService = historyService;
        this.permissionService = permissionService;
    }


    public void generateWav(String inputText, String voice, String projectId, String file, float voiceRate) {

        /* Path où sera stocké le wav */
        Path path = pathService.getSoundFile(projectId, file);
        try {
            Files.createDirectories(path.getParent());
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
        String outputFileName = path.toString();

        /* Appel a MaryTTS */
        MaryInterface marytts = null;
        try {
             marytts = new LocalMaryInterface();
        } catch (MaryConfigurationException e) {
            System.err.println("Could not initialize MaryTTS interface: " + e.getMessage());
            System.exit(1);
        }
        String s = Float.toString(voiceRate);
        maryTts.setAudioEffects("Rate(durScale:"+s+")");
        marytts.setVoice(voice);

        /* Synthèse vocale */
        AudioInputStream audio = null;
        try {
            audio = marytts.generateAudio(inputText);
        } catch (SynthesisException e) {
            System.err.println("Synthesis failed: " + e.getMessage());
            System.exit(1);
        }

        /* Ecriture dans le .wav */
        double[] samples = MaryAudioUtils.getSamplesAsDoubleArray(audio);
        try {
            MaryAudioUtils.writeWavFile(samples, outputFileName, audio.getFormat());
            System.out.println("Output written to " + outputFileName);
        } catch (IOException e) {
            System.err.println("Could not write to file: " + outputFileName + "\n" + e.getMessage());
            System.exit(1);
        }

    }

}