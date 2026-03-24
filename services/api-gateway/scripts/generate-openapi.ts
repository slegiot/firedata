import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import fs from 'fs/promises';
import path from 'path';
import { getServiceUrls } from '../src/proxy.js';
import {
  registerFinanceRoutes,
  registerNewsRoutes,
  registerSportsRoutes,
  registerOddsRoutes,
} from '../src/routes.js';

async function generate() {
  const app = Fastify({ logger: false });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'FireData API',
        description: 'Unified financial, sports, and news data provider',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      security: [{ apiKey: [] }],
    },
  });

  const urls = getServiceUrls();
  await registerFinanceRoutes(app, urls);
  await registerNewsRoutes(app, urls);
  await registerSportsRoutes(app, urls);
  await registerOddsRoutes(app, urls);

  await app.ready();
  const spec = app.swagger();
  
  const outPath = path.resolve(process.cwd(), '../../openapi.json');
  await fs.writeFile(outPath, JSON.stringify(spec, null, 2));
  console.log(`Generated OpenAPI spec at ${outPath}`);
}

generate().catch(console.error);
