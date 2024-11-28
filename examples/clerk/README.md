# Clerk authentication example

Live version: https://clerk-demo.jazz.tools/

## Installing & running the example locally

(this requires `pnpm` to be installed, see [https://pnpm.io/installation](https://pnpm.io/installation))

Start by checking out `jazz`

```bash
git clone https://github.com/gardencmp/jazz.git
cd jazz/examples/clerk
pnpm pack --pack-destination /tmp
mkdir -p ~/jazz-examples/clerk # or any other directory
tar -xf /tmp/jazz-example-clerk-* --strip-components 1 -C ~/jazz-examples/clerk
cd ~/jazz-examples/clerk
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
