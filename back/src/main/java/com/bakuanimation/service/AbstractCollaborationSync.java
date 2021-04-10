package com.bakuanimation.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.HashMultimap;
import com.google.common.collect.Multimaps;
import com.google.common.collect.SetMultimap;
import org.reactivestreams.Publisher;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiFunction;
import java.util.function.Predicate;

final class AbstractCollaborationSync {

    private final BiFunction<String, Predicate<String>, Publisher<String>> broadcaster;

    // user <-> movie
    private final Map<String, String> moviesByUser = new ConcurrentHashMap<>();
    // movie <-> users
    private final SetMultimap<String, String> usersByMovie = Multimaps.synchronizedSetMultimap(HashMultimap.create());
    private SetMultimap<String, String> usernamesByMovie = Multimaps.synchronizedSetMultimap(HashMultimap.create());

    public AbstractCollaborationSync(BiFunction<String, Predicate<String>, Publisher<String>> broadcaster) {
        this.broadcaster = broadcaster;
    }

    public void access(String userId, String username, String movie) {
        moviesByUser.put(userId, movie);
        usersByMovie.put(movie, userId);
        usernamesByMovie.put(movie, username);
        broadcastActiveUserList(movie);
    }

    public Publisher<String> broadcast(String userId, String movie, String event) {
        Set<String> impactedUsers = usersByMovie.get(movie);
        // broadcast event to every user using this movie
        return broadcaster.apply(event, session -> !session.equals(userId) && impactedUsers.contains(session));
    }

    public void disconnect(String userId) {
        String movie = moviesByUser.remove(userId);
        if (movie != null) {
            usersByMovie.remove(movie, userId);
            broadcastActiveUserList(movie);
        }
    }

    private void broadcastActiveUserList(String movie) {
        ObjectNode response = JsonNodeFactory.instance.objectNode();
        response.put("action", "setActiveUsers");
        response.put("value", usernamesByMovie.get(movie).toString());
        broadcaster.apply(response.toString(), session -> usersByMovie.get(movie).contains(session));
    }
}
