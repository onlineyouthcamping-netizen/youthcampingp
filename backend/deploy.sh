#!/bin/bash
npx prisma migrate deploy
node src/server.js
