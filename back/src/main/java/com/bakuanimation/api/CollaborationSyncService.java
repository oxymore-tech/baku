package com.bakuanimation.api;

import org.reactivestreams.Publisher;

public interface CollaborationSyncService {
    void access(String userId, String username, String movie);

    Publisher<String> broadcast(String userId, String movie, String stack);

    String getSession(String sessionId);

}
