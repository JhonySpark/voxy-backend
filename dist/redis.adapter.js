import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
export class RedisIoAdapter extends IoAdapter {
    adapterConstructor;
    async connectToRedis() {
        const pubClient = createClient({ url: `redis://localhost:6379` });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.adapterConstructor = createAdapter(pubClient, subClient);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
//# sourceMappingURL=redis.adapter.js.map