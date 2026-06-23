"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.enableCors({
        origin: [
            'http://localhost:4200',
            'http://localhost:4201',
            /^http:\/\/192\.168\.\d+\.\d+/,
            'https://localhost',
            'capacitor://localhost',
            'ionic://localhost',
            /\.ngrok-free\.dev$/,
            /\.ngrok-free\.app$/,
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'ngrok-skip-browser-warning'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map