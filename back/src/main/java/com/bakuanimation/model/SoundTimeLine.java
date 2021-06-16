package com.bakuanimation.model;

public final class SoundTimeLine {

    private final String soundTimelineId;
    private final String audioId;
    private double pisteNumber;
    private double start;
    private double end;

    public SoundTimeLine(String soundTimelineId, String audioId, double pisteNumber, double start, double end) {
        this.soundTimelineId = soundTimelineId;
        this.audioId = audioId;
        this.pisteNumber = pisteNumber;
        this.start = start;
        this.end = end;
    }

    public String getSoundTimelineId() {
        return soundTimelineId;
    }

    public String getAudioId() {
        return audioId;
    }

    public double getPisteNumber() {
        return pisteNumber;
    }

    public void setPisteNumber(double pisteNumber) {
        this.pisteNumber = pisteNumber;
    }

    public double getStart() {
        return start;
    }

    public void setStart(double start) {
        this.start = start;
    }

    public double getEnd() {
        return end;
    }

    public void setEnd(double end) {
        this.end = end;
    }
}