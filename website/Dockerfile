FROM node:18-slim

COPY node_modules ./node_modules
COPY website/.next/standalone ./website
COPY website/.next/static ./website/.next/static

EXPOSE 3001

ENV PORT 3001

CMD ["node", "website/server.js"]