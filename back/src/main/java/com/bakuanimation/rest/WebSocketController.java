package com.bakuanimation.rest;

import com.bakuanimation.api.CollaborationSyncService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import io.micronaut.websocket.WebSocketBroadcaster;
import io.micronaut.websocket.WebSocketSession;
import io.micronaut.websocket.annotation.OnClose;
import io.micronaut.websocket.annotation.OnError;
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
    private final CollaborationSyncService collaborationSyncService;
    // Map sessionId <-> sessionId between PC & smartphone
    private final BiMap<String, String> links = Maps.synchronizedBiMap(HashBiMap.create());
    // Map websocketSession.id <-> sessionId
    private final Map<String, String> sessions = Maps.newConcurrentMap();

    // Session Ids generator
    private final Supplier<String> idSupplier = () -> UUID.randomUUID().toString();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public WebSocketController(WebSocketBroadcaster broadcaster, CollaborationSyncService collaborationSyncService) {
        this.broadcaster = broadcaster;
        this.collaborationSyncService = collaborationSyncService;
    }

    @OnOpen
    public void onOpen(WebSocketSession session) {
        String sessionId = sessions.computeIfAbsent(session.getId(), s -> idSupplier.get());
        LOGGER.info("new session id {}", sessionId);
    }

    @OnMessage
    public Publisher<String> onMessage(String message, WebSocketSession session) throws JsonProcessingException {
        String sessionId = sessions.get(session.getId());
        LOGGER.debug("message from session id {}: {}", sessionId, message);
        JsonNode jsonNode = objectMapper.readTree(message);
        JsonNode actionNode = jsonNode.get("action");
        JsonNode valueNode = jsonNode.get("value");
        if (actionNode != null) {
            String action = actionNode.asText();
            if (action.equals("getSocketId")) {
                ObjectNode response = JsonNodeFactory.instance.objectNode();
                response.put("action", "getSocketId");
                response.put("value", sessionId);
                return session.send(response.toString());
            } else if (action.equals("link")) {
                String socketId = valueNode.asText();
                links.forcePut(sessionId, socketId);
                ObjectNode response = JsonNodeFactory.instance.objectNode();
                response.put("action", "linkEstablished");
                response.put("value", sessionId);
                return broadcaster.broadcast(response.toString(), aSession -> Optional.ofNullable(sessions.get(aSession.getId()))
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

    @OnError
    public void onError(WebSocketSession session, Throwable error) {
        LOGGER.warn("Error in websocket {}", session.getId(), error);
        collaborationSyncService.disconnect(session.getId());
    }

    @OnClose
    public void onClose(WebSocketSession session) {
        collaborationSyncService.disconnect(session.getId());
        Optional.ofNullable(sessions.remove(session.getId()))
                .ifPresent(sessionId -> {
                    LOGGER.info("Close {}", sessionId);

                    links.remove(sessionId);
                    links.inverse().remove(sessionId);
                });
    }
}
