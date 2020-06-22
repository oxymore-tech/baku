package com.bakuanimation.service;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.Multimaps;
import com.google.common.collect.SetMultimap;
import org.reactivestreams.Publisher;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiFunction;
import java.util.function.Predicate;

final class AbstractCollaborationSync<T> {

    private final BiFunction<T, Predicate<String>, Publisher<T>> broadcaster;

    // user <-> movie
    private final Map<String, String> moviesByUser = new ConcurrentHashMap<>();
    // movie <-> users
    private final SetMultimap<String, String> usersByMovie = Multimaps.synchronizedSetMultimap(HashMultimap.create());

    public AbstractCollaborationSync(BiFunction<T, Predicate<String>, Publisher<T>> broadcaster) {
        this.broadcaster = broadcaster;
    }

    public void access(String userId, String movie) {
        moviesByUser.put(userId, movie);
        usersByMovie.put(movie, userId);
    }

    public Publisher<T> broadcast(String userId, String movie, T stack) {
        Set<String> impactedUsers = usersByMovie.get(movie);
        // broadcast event to every user using this movie
        return broadcaster.apply(stack, session -> !session.equals(userId) && impactedUsers.contains(session));
    }

    public void disconnect(String userId) {
        String movie = moviesByUser.remove(userId);
        if (movie != null) {
            usersByMovie.remove(movie, userId);
        }
    }

}
