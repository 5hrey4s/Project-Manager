// env.d.ts or global.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        readonly POSTGRESS_PASSWORD: string;
        readonly JWT_SECRET: string;
        readonly POSTGRESS_USERNAME: string;
        readonly DB_PORT: string
        readonly DB_DATABASE: string
        readonly DB_HOST: string
    }
}