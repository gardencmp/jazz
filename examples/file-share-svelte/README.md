# File Share (Svelte)

This example app demonstrates how to implement secure file sharing in a Svelte application using Jazz.

## Features

- Secure file uploads and downloads
- End-to-end encryption
- File access management
- Integration with Jazz storage system
- Passkey authentication

## Getting Started

1. Clone the repository:

```sh
git clone https://github.com/garden-co/jazz.git
```

2. Install dependencies:

```sh
pnpm install
```

3. Navigate to the example directory:

```sh
cd examples/file-share-svelte
```

4. Start the development server:

```sh
pnpm dev
```

5. Open your browser and visit [http://localhost:5173](http://localhost:5173)

## How It Works

This example showcases how to:
- Upload files securely with end-to-end encryption
- Generate and manage sharing links
- Handle file downloads with decryption
- Manage file access permissions
- Authenticate users using passkeys

## Learn More

- [Jazz Documentation](https://jazz.tools/docs/svelte)
- [Svelte Documentation](https://svelte.dev)
- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
