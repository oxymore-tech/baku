package com.bakuanimation.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class GithubIssue {
    private final String title;
    private final String body;

    @JsonCreator
    public GithubIssue(@JsonProperty("title") String title,
                       @JsonProperty("body") String body) {
        this.title = title;
        this.body = body;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }
}
