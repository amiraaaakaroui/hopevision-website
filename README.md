# HopeVision — Coming Soon

This is a minimal, production-ready "Coming Soon" landing page for **hopevision.health**.

## Deploy (Vercel)
1. Create a new GitHub repo and push these files.
2. Go to https://vercel.com → New Project → import your repo → Deploy.
3. In **Project → Settings → Domains**, add `hopevision.health`.
4. In Porkbun DNS set:
   - `A @ 76.76.21.21`
   - `CNAME www cname.vercel-dns.com`
5. Verify on Vercel. HTTPS auto-activates.

## Email collection (optional)
- Replace the `action="#"` of the `<form>` in `index.html` with your Formspree/Getform endpoint.

## Customize
- Replace `logo.svg` with your brand mark (same filename).
- Update text, colors in `styles.css`, and social links in `index.html`.
