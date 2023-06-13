import http from 'node:http'

declare global {
    namespace globalThis {
        // eslint-disable-next-line no-var
        var httpServer: Promise<http.Server>
    }
}