# Mobile Khata automated test

Runs automatically on GitHub (Actions tab) after every push. It opens the app in
demo mode and checks, step by step:

1. Login screen opens, shows "Mobile Khata", text is readable
2. Workspace opens with all menu tabs
3. Add a customer, add a product
4. Create a quotation and an invoice (2 x 1,000 + 18% GST = 2,360)
5. Invoice print layout builds
6. Record a payment of 500
7. Dashboard totals update
8. Every menu page opens without errors
9. Only the Mobile Khata name appears on screen (no old brand names)
10. All text has enough contrast to read on the pastel colours
11. Urdu language works, data is kept after reload

Screenshots of each step are saved as "mobile-khata-screenshots" on the run page.

Run it on your own computer (needs Node.js):
    cd public && python3 -m http.server 5300     (keep this running)
    cd tests/e2e && npm install && npx playwright install chromium && npm test
