package com.bakuanimation.service;

import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.ImageService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.BakuAction;
import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.bakuanimation.api.SoundService;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableListMultimap;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.imageio.stream.ImageOutputStream;
import javax.inject.Singleton;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import javax.sound.sampled.*;

@Singleton
public class TTSServiceImpl implements TTSService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SoundServiceImpl.class);

    private final PathService pathService;
    private final HistoryService historyService;
    private final PermissionService permissionService;

    public TTSServiceImpl(PathService pathService, HistoryService historyService, PermissionService permissionService) {
        this.pathService = pathService;
        this.historyService = historyService;
        this.permissionService = permissionService;
    }


    public void save(String projectId, InputStream inputStream, String filename){
        Path path = pathService.getSoundFile(projectId, filename);
        try {
            Files.createDirectories(path.getParent());
            //byte buffer[] = IOUtils.toByteArray(inputStream);
            try(OutputStream outputStream = new FileOutputStream(path.toFile())){
                IOUtils.copy(inputStream, outputStream);
            } catch (FileNotFoundException e) {
                throw new RuntimeException(e);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }


    }

    public void delete(String projectId, String filename){
        Path path = pathService.getSoundFile(projectId, filename);
        try {
            Files.deleteIfExists(path);
        } catch (IOException e){
            throw new RuntimeException(e);
        }
    }

    public void generateVoice(String inputText, String filename, String voiceUsed) throws Exception {

        /* Initialisation de la voix */
        if (voiceUsed.equals("upmc-pierre-hsmm")
                || voiceUsed.equals("upmc-jessica-hsmm")
                || voiceUsed.equals("enst-dennys-hsmm")
                || voiceUsed.equals("enst-camille-hsmm")) marytts.setVoice(voiceUsed);


        else throw new IllegalArgumentException("La voix n'est pas enregistrée");

        /* Synthèse */
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
            MaryAudioUtils.writeWavFile(samples, fileName, audio.getFormat());
            System.out.println("Output written to " + fileName);
        } catch (IOException e) {
            System.err.println("Could not write to file: " +fileName + "\n" + e.getMessage());
            System.exit(1);
        }

    }