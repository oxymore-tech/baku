package com.bakuanimation.service;

import com.bakuanimation.api.CollaborationSyncService;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import io.micronaut.websocket.WebSocketBroadcaster;
import io.micronaut.websocket.WebSocketSession;
import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

@Singleton
public final class WebsocketCollaborationSync implements CollaborationSyncService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebsocketCollaborationSync.class);

    private final AbstractCollaborationSync<String> collaborationSync;

    // Map sessionId <-> sessionId between PC & smartphone
    private final BiMap<String, String> links = Maps.synchronizedBiMap(HashBiMap.create());
    // Map websocketSession.id <-> sessionId
    private final Map<String, String> sessions = Maps.newConcurrentMap();

    // Session Ids generator
    private final Supplier<String> idSupplier = () -> UUID.randomUUID().toString();

    public WebsocketCollaborationSync(WebSocketBroadcaster broadcaster) {
        collaborationSync = new AbstractCollaborationSync<>((message, filter) ->
                broadcaster.broadcast(message, session -> filter.test(getSession(session))));
    }

    public void openSession(WebSocketSession session) {
        String sessionId = sessions.computeIfAbsent(session.getId(), s -> idSupplier.get());
        LOGGER.info("new session id {}", sessionId);
    }

    public String getSession(WebSocketSession session) {
        return sessions.get(session.getId());
    }

    public void openLink(String sessionId, String socketId) {
        links.forcePut(sessionId, socketId);
    }

    public String destinationId(String sessionId) {
        return Optional.ofNullable(links.get(sessionId))
                .or(() -> Optional.ofNullable(links.inverse().get(sessionId)))
                .orElse(sessionId);
    }

    public void cleanSession(WebSocketSession session) {
        Optional.ofNullable(sessions.remove(session.getId()))
                .ifPresent(sessionId -> {
                    LOGGER.info("Close {}", sessionId);

                    links.remove(sessionId);
                    links.inverse().remove(sessionId);
                    collaborationSync.disconnect(sessionId);
                });
    }

    @Override
    public void access(String userId, String movie) {
        collaborationSync.access(userId, movie);
    }

    @Override
    public Publisher<String> broadcast(String userId, String movie, String stack) {
        return collaborationSync.broadcast(userId, movie, stack);
    }
}
