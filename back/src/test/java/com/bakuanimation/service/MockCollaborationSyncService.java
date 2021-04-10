package com.bakuanimation.service;

import com.bakuanimation.api.CollaborationSyncService;
import io.reactivex.Flowable;
import org.reactivestreams.Publisher;

public final class MockCollaborationSyncService implements CollaborationSyncService {
    @Override
    public void access(String userId, String username, String movie) {

    }

    @Override
    public Publisher<String> broadcast(String userId, String movie, String stack) {
        return Flowable.just(stack);
    }

    @Override
    public String getSession(String sessionId) {
        return null;
    }
}
