package com.bakuanimation.server;

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

@ServerWebSocket("/echo")
public final class WebSocketController {

    private WebSocketBroadcaster broadcaster;

    public WebSocketController(WebSocketBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @OnOpen
    public void onOpen(WebSocketSession session) {
        System.out.println(session);
    }

    @OnMessage
    public Publisher<String> onMessage(String message, WebSocketSession session) {
        System.out.println(message);
        JsonObject o = JsonParser.parseString(message).getAsJsonObject();
        if (o.get("action") != null) {
            String action = o.get("action").getAsString();
            if (action.equals("getSocketId")) {
                JsonObject p = new JsonObject();
                p.add("action", new JsonPrimitive("getSocketId"));
                p.add("value", new JsonPrimitive(session.getId()));
                return session.send(p.toString());
            } else if (action.equals("link")) {
                String from = session.getId();
                //String to = o.get("value").getAsString();
                JsonObject p = new JsonObject();
                p.add("linkEstablished", new JsonPrimitive(from));
                p.add("value", new JsonPrimitive(from));
                //p.add("to", new JsonPrimitive(to));
                return session.send(p.toString());
            }
        }
        return broadcaster.broadcast(message);

    }

    @OnClose
    public void onClose(WebSocketSession session) {

    }
}
