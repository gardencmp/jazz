FROM node:22-slim

COPY node_modules ./node_modules
COPY homepage/.next/standalone ./homepage
COPY homepage/.next/static ./homepage/.next/static

EXPOSE 3001

ENV PORT 3001

CMD ["node", "homepage/server.js"]