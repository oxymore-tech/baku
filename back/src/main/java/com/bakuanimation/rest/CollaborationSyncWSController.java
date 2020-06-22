package com.bakuanimation.rest;


import com.bakuanimation.api.CollaborationSyncService;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.micronaut.websocket.WebSocketSession;
import io.micronaut.websocket.annotation.*;
import io.reactivex.Flowable;
import org.reactivestreams.Publisher;

@ServerWebSocket("/sync")
public final class CollaborationSyncWSController {

    private final CollaborationSyncService collaborationSyncService;

    public CollaborationSyncWSController(CollaborationSyncService collaborationSyncService) {
        this.collaborationSyncService = collaborationSyncService;
    }

    @OnOpen
    public void onOpen(WebSocketSession session) {

    }

    @OnMessage
    public Publisher<String> onMessage(String message, WebSocketSession session) {
        JsonObject jsonMessage = JsonParser.parseString(message).getAsJsonObject();
        JsonElement accessObject = jsonMessage.get("access");
        if (accessObject != null) {
            String movie = accessObject.getAsJsonObject().get("movie").getAsString();
            collaborationSyncService.access(session.getId(), movie);
        }
        return Flowable.empty();
    }

    @OnError
    public void onError(WebSocketSession session, Throwable error) {
        collaborationSyncService.disconnect(session.getId());
    }

    @OnClose
    public void onClose(WebSocketSession session) {
        collaborationSyncService.disconnect(session.getId());
    }
}
