package com.bakuanimation.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Objects;

public final class BakuEvent {
    private final int action;
    private final JsonNode value;
    private final String user;
    private final String timestamp;

    @JsonCreator
    public BakuEvent(@JsonProperty("action") int action,
                     @JsonProperty("value") JsonNode value,
                     @JsonProperty("user") String user,
                     @JsonProperty("timestamp") String timestamp) {
        this.action = action;
        this.value = value;
        this.user = user;
        this.timestamp = timestamp;
    }

    public int getAction() {
        return action;
    }

    public JsonNode getValue() {
        return value;
    }

    public String getUser() {
        return user;
    }

    public String getTimestamp() {
        return timestamp;
    }

    @Override
    public String toString() {
        return "BakuEvent{" +
                "action=" + action +
                ", value=" + value +
                ", user='" + user + '\'' +
                ", timestamp='" + timestamp + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BakuEvent bakuEvent = (BakuEvent) o;
        return action == bakuEvent.action &&
                Objects.equals(value, bakuEvent.value) &&
                Objects.equals(user, bakuEvent.user) &&
                Objects.equals(timestamp, bakuEvent.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(action, value, user, timestamp);
    }
}
