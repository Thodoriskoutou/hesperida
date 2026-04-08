import { mock } from 'bun:test';

const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const baseNamespace = Bun.env.SURREAL_NAMESPACE?.trim() || 'main';
const baseDatabase = Bun.env.SURREAL_DATABASE?.trim() || 'main';

Bun.env.APP_MODE = Bun.env.APP_MODE?.trim() || 'both';
Bun.env.WEB_API_KEY = Bun.env.WEB_API_KEY?.trim() || 'test-web-api-key';
Bun.env.SURREAL_USER = Bun.env.SURREAL_USER?.trim() || 'root';
Bun.env.SURREAL_PASS = Bun.env.SURREAL_PASS?.trim() || 'root';
Bun.env.SURREAL_PROTOCOL = Bun.env.SURREAL_PROTOCOL?.trim() || 'http';
Bun.env.SURREAL_ADDRESS = Bun.env.SURREAL_ADDRESS?.trim() || '127.0.0.1:8000';
Bun.env.DEBUG = Bun.env.DEBUG?.trim() || 'false';

Bun.env.SURREAL_NAMESPACE = `${baseNamespace}_api_test_${runId}`;
Bun.env.SURREAL_DATABASE = `${baseDatabase}_api_test_${runId}`;

Bun.env.TEST_RUN_ID = runId;

mock.module('$env/dynamic/private', () => ({ env: Bun.env }));
