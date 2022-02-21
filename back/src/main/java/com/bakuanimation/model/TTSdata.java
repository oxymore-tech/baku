package com.bakuanimation.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class TTSdata {

    private final String voice;
    private final String text;
    private final String fileName;
    private final Float voiceRate;

    @JsonCreator
    public TTSdata( @JsonProperty("voice") String voice,
                    @JsonProperty("text") String text,
                    @JsonProperty("fileName") String fileName,
		    @JsonProperty("voiceRate") Float voiceRate) {

        this.voice = voice;
        this.text = text;
        this.fileName = fileName;
	this.voiceRate = voiceRate;
    }

    public String getVoice() {
        return voice;
    }

    public String getText() {
        return text;
    }

    public String getFileName() {
        return fileName;
    }


    public float getVoiceRate() {
        return voiceRate;
    }


}
