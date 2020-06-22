package com.bakuanimation.api;

import org.reactivestreams.Publisher;

public interface CollaborationSyncService {
    void access(String userId, String movie);

    Publisher<String> broadcast(String userId, String movie, String stack);

    void disconnect(String userId);

}
