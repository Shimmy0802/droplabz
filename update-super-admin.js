#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)="(.+)"$/);
    if (match) {
        envVars[match[1]] = match[2];
    }
});

// Set env vars
Object.assign(process.env, envVars);

// Now load Prisma from web app
const prismaModule = await import('./apps/web/node_modules/@prisma/client/index.js');
const { PrismaClient } = prismaModule;
const db = new PrismaClient();

async function main() {
    const user = await db.user.update({
        where: { discordId: '1017201660839333899' },
        data: { role: 'SUPER_ADMIN' },
    });

    console.log('✅ User updated to SUPER_ADMIN:', user.username);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
