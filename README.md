This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WebRTC Calls (TURN/STUN)

Direct calls use WebRTC. For reliable connectivity across different networks/NATs, configure a TURN server (recommended: your own coturn or a managed provider). The app falls back to public OpenRelay, which may be rate‑limited or blocked in corporate networks.

- `NEXT_PUBLIC_TURN_SERVER`: e.g. `turns:your.turn.host:443?transport=tcp`
- `NEXT_PUBLIC_TURN_USERNAME`: your TURN username
- `NEXT_PUBLIC_TURN_CREDENTIAL`: your TURN credential/password
- `NEXT_PUBLIC_WEBRTC_FORCE_RELAY` (optional): set to `true` to force TURN‑only if peers cannot connect via STUN/UDP

Create a `.env.local` in the project root:

```env
NEXT_PUBLIC_TURN_SERVER=turns:turn.example.com:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=your_user
NEXT_PUBLIC_TURN_CREDENTIAL=your_password
# Optional: use TURN only (helps on very restrictive networks)
NEXT_PUBLIC_WEBRTC_FORCE_RELAY=true
```

Notes:
- Prefer `turns:` over TLS on port 443 for networks that block UDP.
- If you cannot run a TURN server, try the default fallback first, then enable `NEXT_PUBLIC_WEBRTC_FORCE_RELAY`.
