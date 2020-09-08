package com.bakuanimation.rest;

import com.bakuanimation.service.WebsocketCollaborationSync;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

import java.util.Optional;

@ServerWebSocket("/echo")
public final class WebSocketController {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebSocketController.class);

    private final WebSocketBroadcaster broadcaster;
    private final WebsocketCollaborationSync collaborationSyncService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public WebSocketController(WebSocketBroadcaster broadcaster, WebsocketCollaborationSync collaborationSyncService) {
        this.broadcaster = broadcaster;
        this.collaborationSyncService = collaborationSyncService;
    }

    @OnOpen
    public void onOpen(WebSocketSession session) {
        collaborationSyncService.openSession(session);

    }

    @OnMessage
    public Publisher<String> onMessage(String message, WebSocketSession session) throws JsonProcessingException {
        String sessionId = collaborationSyncService.getSession(session.getId());
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
                collaborationSyncService.openLink(sessionId, socketId);
                ObjectNode response = JsonNodeFactory.instance.objectNode();
                response.put("action", "linkEstablished");
                response.put("value", sessionId);
                return broadcaster.broadcast(response.toString(), aSession -> Optional.ofNullable(collaborationSyncService.getSession(aSession.getId()))
                        .map(socketId::equals)
                        .orElse(false));
            }
        }
        String destId = collaborationSyncService.destinationId(sessionId);

        return broadcaster.broadcast(message, aSession -> Optional.ofNullable(collaborationSyncService.getSession(aSession.getId()))
                .map(destId::equals)
                .orElse(false));
    }

    @OnError
    public void onError(WebSocketSession session, Throwable error) {
        LOGGER.warn("Error in websocket {}", session.getId(), error);
        collaborationSyncService.cleanSession(session);
    }

    @OnClose
    public void onClose(WebSocketSession session) {
        collaborationSyncService.cleanSession(session);
    }
}
