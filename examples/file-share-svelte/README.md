# File share example with Jazz and Svelte

This example app demonstrates how to implement secure file sharing in a Svelte application using Jazz.

## Features

This example showcases how to:

- Upload files securely with end-to-end encryption
- Generate and manage sharing links
- Handle file downloads with decryption
- Manage file access permissions
- Authenticate users using passkeys

## Getting Started

1. Clone the repository:

```sh
git clone https://github.com/garden-co/jazz.git
```

2. Navigate to the example directory:

```sh
cd examples/file-share-svelte
```

3. Install dependencies:

```sh
pnpm install
```

4. Run the development server:

```sh
turbo dev
```

5. Open your browser and visit [http://localhost:5173](http://localhost:5173)

---

Alternatively, you can build and preview the app:

```sh
turbo build
pnpm preview
```

## Learn More

- [Jazz Documentation](https://jazz.tools/docs/svelte)
- [Svelte Documentation](https://svelte.dev)
- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
