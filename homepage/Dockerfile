FROM node:18-slim

COPY node_modules ./node_modules
COPY homepage/.next/standalone ./homepage

EXPOSE 3001

ENV PORT 3001

CMD ["node", "homepage/server.js"]