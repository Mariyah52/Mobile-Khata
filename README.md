# Mobile Khata

Business app for small businesses: quotations, delivery challans, invoices,
sales tax invoices, purchases, stock, payments, expenses and ledgers.
Works on phone and computer, and offline (data syncs when back online).

- Frontend: `public/index.html` (single page app), hosted on Netlify
- Database and login: Firebase (Firestore + Authentication)
- Security rules: `firestore.rules`
- Automated test: `tests/e2e` (runs on every push, see the Actions tab)

## First-time setup
1. Create a Firebase project, enable Email/Password sign-in and Firestore.
2. Paste `firestore.rules` into Firestore → Rules → Publish.
3. Put the web app config into `SAAS_FIREBASE_CONFIG` in `public/index.html`.
4. Connect this repository to Netlify (publish folder: `public`).
5. Add the Netlify domain to Firebase → Authentication → Settings → Authorized domains.
