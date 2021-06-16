package com.bakuanimation.model;

import java.io.*;

public final class Audio {
    private final String id;
    private String title;
    private InputStream sound;
    private InputStream waveform;
    private double volume;
    private double duration;

    public Audio(String id, String title, InputStream sound, InputStream waveform, double volume, double duration) {
        this.id = id;
        this.title = title;
        this.sound = sound;
        this.waveform = waveform;
        this.volume = volume;
        this.duration = duration;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public InputStream getSound() {
        return sound;
    }

    public void setSound(InputStream sound) {
        this.sound = sound;
    }

    public InputStream getWaveform() {
        return waveform;
    }

    public void setWaveform(InputStream waveform) {
        this.waveform = waveform;
    }

    public double getVolume() {
        return volume;
    }

    public void setVolume(double volume) {
        this.volume = volume;
    }

    public double getDuration() {
        return duration;
    }

    public void setDuration(double duration) {
        this.duration = duration;
    }
}