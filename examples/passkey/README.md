# Passkey authentication example

Live version: https://passkey-demo.jazz.tools/

## Installing & running the example locally

(this requires `pnpm` to be installed, see [https://pnpm.io/installation](https://pnpm.io/installation))

Start by checking out `jazz`

```bash
git clone https://github.com/gardencmp/jazz.git
cd jazz/examples/passkey
pnpm pack --pack-destination /tmp
mkdir -p ~/jazz-examples/passkey # or any other directory
tar -xf /tmp/jazz-example-passkey-* --strip-components 1 -C ~/jazz-examples/passkey
cd ~/jazz-examples/passkey
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
