import http from "http";
import https from "https";

export default function <T extends http.Server>(server: T) {

    const connections = new Map();
    const closeFn = server.close.bind(server);

    function onConnection(socket) {
        connections.set(socket, 0);
        socket.once("close", () => connections.delete(socket));
    }

    if (server instanceof https.Server) {
        server.on("secureConnection", onConnection);
    } else {
        server.on("connection", onConnection);
    }

    return (callback?: (err: Error) => void) => {
        connections.forEach((_, socket) => socket.destroy());
        return closeFn(callback);
    };

}
