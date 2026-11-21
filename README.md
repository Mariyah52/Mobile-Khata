# Mobile Khata

Business app for small businesses: quotations, delivery challans, invoices,
sales tax invoices, purchases, stock, payments, expenses and ledgers.
Works on phone and computer, and offline (data syncs when back online).

- Frontend: `public/index.html` (single page app), hosted on Firebase Hosting (project `mobile-khata-b9eb5`)
- Database and login: Firebase (Firestore + Authentication)
- Security rules: `firestore.rules`
- Automated test: `tests/e2e` (runs on every push, see the Actions tab)

## First-time setup
1. Create a Firebase project, enable Email/Password sign-in and Firestore.
2. Paste `firestore.rules` into Firestore → Rules → Publish.
3. Put the web app config into `SAAS_FIREBASE_CONFIG` in `public/index.html`.
4. Deploy: `firebase deploy --only hosting,firestore:rules` (publish folder: `public`).
5. Add your live domain to Firebase → Authentication → Settings → Authorized domains
   (`mobile-khata-b9eb5.web.app` and `mobilekhata.imadi.tech`).

## Custom domain (mobilekhata.imadi.tech)
1. Firebase Console → Hosting → Add custom domain → `mobilekhata.imadi.tech`.
2. In Cloudflare DNS (imadi.tech) add the records Firebase shows (usually an `A` record
   or `CNAME`, plus a `TXT` verification record). Set the proxy status to **DNS only**
   (grey cloud) until Firebase shows the domain as Connected and the SSL certificate is issued.
3. Add `mobilekhata.imadi.tech` to Authentication → Authorized domains, otherwise login fails on the new domain.
