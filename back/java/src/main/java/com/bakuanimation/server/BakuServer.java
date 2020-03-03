package com.bakuanimation.server;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableSet;
import com.liveaction.reactiff.api.server.ReactiveFilter;
import com.liveaction.reactiff.codec.CodecManagerImpl;
import com.liveaction.reactiff.codec.RawBinaryCodec;
import com.liveaction.reactiff.codec.RawFileCodec;
import com.liveaction.reactiff.codec.TextPlainCodec;
import com.liveaction.reactiff.codec.jackson.JsonCodec;
import com.liveaction.reactiff.codec.jackson.SmileBinaryCodec;
import com.liveaction.reactiff.server.DefaultFilters;
import com.liveaction.reactiff.server.ReactiveHttpServer;
import reactor.netty.http.HttpProtocol;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class BakuServer {

    public static void main(String[] args) throws IOException {
        Path dataPath = args.length >=1 ? Paths.get(args[0]) : Paths.get("data");
        Path historyDirectory = dataPath.resolve("stacks");
        Path imagesDirectory = dataPath.resolve("images");

        HistoryService historyService = new HistoryService(historyDirectory);
        ImageService imageService = new ImageService(imagesDirectory);

        ReactiveFilter cors = DefaultFilters.cors(
                ImmutableSet.of("*"),
                ImmutableSet.of("Content-Disposition", "Content-Type", "APP-Version", "APP-Platform", "Content-Range"),
                ImmutableSet.of("GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"),
                true,
                -1
        );

        ReactiveHttpServer.create()
                .port(3030)
                .host("0.0.0.0")
                .handler(new HistoryController(historyService))
                .handler(new ImageController(imageService))
                .filter(cors)
                .codecManager(getCodecManager())
                .protocols(HttpProtocol.HTTP11)
                .build()
                .startAndWait();
    }

    private static CodecManagerImpl getCodecManager() {
        CodecManagerImpl codecManager = new CodecManagerImpl();
        codecManager.addCodec(new TextPlainCodec());
        codecManager.addCodec(new RawBinaryCodec());
        codecManager.addCodec(new RawFileCodec());
        ObjectMapper objectMapper = new ObjectMapper();
        codecManager.addCodec(new JsonCodec(objectMapper));
        codecManager.addCodec(new SmileBinaryCodec(objectMapper));
        return codecManager;
    }
}
