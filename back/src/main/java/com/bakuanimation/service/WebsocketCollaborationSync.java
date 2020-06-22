package com.bakuanimation.service;

import com.bakuanimation.api.CollaborationSyncService;
import io.micronaut.websocket.WebSocketBroadcaster;
import org.reactivestreams.Publisher;

import javax.inject.Singleton;

@Singleton
public final class WebsocketCollaborationSync implements CollaborationSyncService {

    private final AbstractCollaborationSync<String> collaborationSync;

    public WebsocketCollaborationSync(WebSocketBroadcaster broadcaster) {
        collaborationSync = new AbstractCollaborationSync<>((message, filter) ->
                broadcaster.broadcast(message, session -> filter.test(session.getId())));
    }


    @Override
    public void access(String userId, String movie) {
        collaborationSync.access(userId, movie);
    }

    @Override
    public Publisher<String> broadcast(String userId, String movie, String stack) {
        return collaborationSync.broadcast(userId, movie, stack);
    }

    @Override
    public void disconnect(String userId) {
        collaborationSync.disconnect(userId);
    }
}
