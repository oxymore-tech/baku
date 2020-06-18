package com.bakuanimation.rest;

import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import io.micronaut.websocket.WebSocketBroadcaster;
import io.micronaut.websocket.WebSocketSession;
import io.micronaut.websocket.annotation.OnClose;
import io.micronaut.websocket.annotation.OnMessage;
import io.micronaut.websocket.annotation.OnOpen;
import io.micronaut.websocket.annotation.ServerWebSocket;
import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

@ServerWebSocket("/echo")
public final class WebSocketController {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebSocketController.class);

    private final WebSocketBroadcaster broadcaster;
    // Map sessionId <-> sessionId between PC & smartphone
    private final BiMap<String, String> links = Maps.synchronizedBiMap(HashBiMap.create());
    // Map websocketSession.id <-> sessionId
    private final Map<String, String> sessions = Maps.newConcurrentMap();

    // Session Ids generator
    private final Supplier<String> idSupplier = () -> UUID.randomUUID().toString();

    public WebSocketController(WebSocketBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @OnOpen
    public void onOpen(WebSocketSession session) {
        String sessionId = sessions.computeIfAbsent(session.getId(), s -> idSupplier.get());
        LOGGER.info("new session id {}", sessionId);
    }

    @OnMessage
    public Publisher<String> onMessage(String message, WebSocketSession session) {
        String sessionId = sessions.get(session.getId());
        LOGGER.debug("message from session id {}: {}", sessionId, message);
        JsonObject o = JsonParser.parseString(message).getAsJsonObject();
        if (o.get("action") != null) {
            String action = o.get("action").getAsString();
            if (action.equals("getSocketId")) {
                JsonObject p = new JsonObject();
                p.add("action", new JsonPrimitive("getSocketId"));
                p.add("value", new JsonPrimitive(sessionId));
                return session.send(p.toString());
            } else if (action.equals("link")) {
                String socketId = o.get("value").getAsString();
                links.forcePut(sessionId, socketId);
                JsonObject p = new JsonObject();
                p.add("action", new JsonPrimitive("linkEstablished"));
                p.add("value", new JsonPrimitive(sessionId));
                return broadcaster.broadcast(p.toString(), aSession -> Optional.ofNullable(sessions.get(aSession.getId()))
                        .map(socketId::equals)
                        .orElse(false));
            }
        }
        String destId = Optional.ofNullable(links.get(sessionId))
                .orElseGet(() -> Optional.ofNullable(links.inverse().get(sessionId))
                        .orElse(sessionId));

        return broadcaster.broadcast(message, aSession -> Optional.ofNullable(sessions.get(aSession.getId()))
                .map(destId::equals)
                .orElse(false));

    }

    @OnClose
    public void onClose(WebSocketSession session) {
        Optional.ofNullable(sessions.remove(session.getId()))
                .ifPresent(sessionId -> {
                    LOGGER.info("Close {}", sessionId);

                    links.remove(sessionId);
                    links.inverse().remove(sessionId);
                });
    }
}
