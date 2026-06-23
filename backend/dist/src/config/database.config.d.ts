import { ConfigService } from '@nestjs/config';
export declare class DatabaseConfig {
    private configService;
    constructor(configService: ConfigService);
    getDatabaseUrl(): string;
    getPrismaOptions(): {
        log: string[];
    };
}
