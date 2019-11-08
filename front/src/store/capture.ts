export interface CaptureState {
    stream: MediaStream | null;
    activeCapture: boolean;
}

export const captureStore = {
    namespaced: true,
    state: {
        stream: null,
        activeCapture: false,
    },
    mutations: {
        attachMediaStream(state: CaptureState, stream: MediaStream) {
            state.stream = stream;
        },
        detachMediaStream(state: CaptureState) {
            if (state.stream) {
                state.stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            state.stream = null;
        },
        toggleCapture(state: CaptureState) {
            state.activeCapture = !state.activeCapture;
        },
    },
    actions: {
    },
    getters: {
    },
    modules: {},
};
