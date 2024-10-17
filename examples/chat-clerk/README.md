# Jazz Chat Example (with Clerk auth)

Live version: [https://chat-clerk-demo.jazz.tools](https://chat-clerk-demo.jazz.tools)

## Installing & running the example locally

(this requires `pnpm` to be installed, see [https://pnpm.io/installation](https://pnpm.io/installation))

Start by checking out `jazz`

```bash
git clone https://github.com/gardencmp/jazz.git
cd jazz/examples/chat-clerk
pnpm pack --pack-destination /tmp
mkdir -p ~/jazz-examples/chat-clerk # or any other directory
tar -xf /tmp/jazz-example-chat-* --strip-components 1 -C ~/jazz-examples/chat-clerk
cd ~/jazz-examples/chat-clerk
```

This ensures that you have the example app without git history and independent of the Jazz multi-package monorepo.

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

## Questions / problems / feedback

If you have feedback, let us know on [Discord](https://discord.gg/utDMjHYg42) or open an issue or PR to fix something that seems wrong.

## Configuration: sync server

By default, the example app uses [Jazz Cloud](https://jazz.tools/cloud) (`wss://cloud.jazz.tools`) - so cross-device use, invites and collaboration should just work.

You can also run a local sync server by running `npx jazz-run sync` and adding the query param `?sync=ws://localhost:4200` to the URL of the example app (for example: `http://localhost:5173/?peer=ws://localhost:4200`), or by setting the `sync` parameter of the `<Jazz.Provider>` provider component in [./src/2_main.tsx](./src/2_main.tsx).
