/**
 * firestore.rules.test.js
 *
 * Automated tests for firestore.rules, using the Firebase emulator — this is
 * the "don't guess, verify" step called for in review. This file was NOT run
 * in the sandbox that generated it (no network access to the emulator
 * binaries there); run it yourself before trusting the rules in production.
 *
 * Setup (one-time):
 *   npm install --save-dev @firebase/rules-unit-testing mocha
 *
 * Run:
 *   firebase emulators:exec --only firestore "mocha firestore.rules.test.js --timeout 20000"
 *
 * Covers every scenario from the manual cross-check earlier, PLUS the ones
 * that check found were previously unverified or broken (invite flow,
 * warehouse/parties write scope, settings restricted to owner/admin, trial
 * expiry blocking writes but not reads).
 */

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');

let testEnv;

const COMPANY_A = 'company-a';
const COMPANY_B = 'company-b';

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'rules-test-project',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8'),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── helpers ────────────────────────────────────────────────────────────
function asUser(uid, email) {
  return testEnv.authenticatedContext(uid, email ? { email } : {}).firestore();
}
function asAnon() {
  return testEnv.unauthenticatedContext().firestore();
}

/** Seeds a company + owner member + one member of each other role, bypassing rules. */
async function seedCompany(companyId, { status = 'trial' } = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`companies/${companyId}`).set({
      id: companyId, name: 'Test Co', ownerUid: `${companyId}-owner`,
      plan: 'trial', status, trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const roles = ['owner', 'admin', 'sales', 'accounts', 'warehouse', 'viewer'];
    for (const role of roles) {
      await db.doc(`companies/${companyId}/members/${companyId}-${role}`).set({
        uid: `${companyId}-${role}`, role, status: 'active', name: role, email: `${role}@test.com`,
      });
    }
  });
}

// ═══ TENANT ISOLATION ═══
describe('tenant isolation', () => {
  beforeEach(async () => {
    await seedCompany(COMPANY_A);
    await seedCompany(COMPANY_B);
  });

  it('a member of Company A cannot READ Company B data', async () => {
    const db = asUser(`${COMPANY_A}-owner`);
    await assertFails(db.collection(`companies/${COMPANY_B}/customers`).get());
  });

  it('a member of Company A cannot WRITE Company B data', async () => {
    const db = asUser(`${COMPANY_A}-owner`);
    await assertFails(
      db.doc(`companies/${COMPANY_B}/customers/c1`).set({ name: 'Hacked', updatedAt: new Date().toISOString() })
    );
  });

  it('a member of Company A CAN read/write their own company data', async () => {
    const db = asUser(`${COMPANY_A}-owner`);
    await assertSucceeds(
      db.doc(`companies/${COMPANY_A}/customers/c1`).set({ name: 'Real Customer', updatedAt: new Date().toISOString() })
    );
    await assertSucceeds(db.collection(`companies/${COMPANY_A}/customers`).get());
  });

  it('an unauthenticated user cannot read anything', async () => {
    const db = asAnon();
    await assertFails(db.collection(`companies/${COMPANY_A}/customers`).get());
  });
});

// ═══ ROLE PERMISSIONS ═══
describe('role permissions', () => {
  beforeEach(async () => seedCompany(COMPANY_A));

  it('viewer cannot write anywhere', async () => {
    const db = asUser(`${COMPANY_A}-viewer`);
    await assertFails(
      db.doc(`companies/${COMPANY_A}/quotations/q1`).set({ number: 'Q1', updatedAt: new Date().toISOString() })
    );
  });

  it('viewer CAN read', async () => {
    const db = asUser(`${COMPANY_A}-viewer`);
    await assertSucceeds(db.collection(`companies/${COMPANY_A}/quotations`).get());
  });

  it('viewer cannot delete', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      ctx.firestore().doc(`companies/${COMPANY_A}/products/p1`).set({ name: 'Widget', updatedAt: new Date().toISOString() })
    );
    const db = asUser(`${COMPANY_A}-viewer`);
    await assertFails(db.doc(`companies/${COMPANY_A}/products/p1`).delete());
  });

  it('sales CAN write quotations/invoices/parties/payments', async () => {
    const db = asUser(`${COMPANY_A}-sales`);
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/quotations/q1`).set({ number: 'Q1', updatedAt: new Date().toISOString() }));
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/customers/c1`).set({ name: 'X', updatedAt: new Date().toISOString() }));
  });

  it('sales CANNOT edit settings (branding/theme)', async () => {
    const db = asUser(`${COMPANY_A}-sales`);
    await assertFails(db.doc(`companies/${COMPANY_A}/settings/branding`).set({ name: 'Hacked', updatedAt: new Date().toISOString() }));
  });

  it('sales CANNOT write purchases/expenses/bank (accounts/warehouse territory)', async () => {
    const db = asUser(`${COMPANY_A}-sales`);
    await assertFails(db.doc(`companies/${COMPANY_A}/purchases/po1`).set({ number: 'PO1', updatedAt: new Date().toISOString() }));
    await assertFails(db.doc(`companies/${COMPANY_A}/expenses/e1`).set({ amount: 100, updatedAt: new Date().toISOString() }));
  });

  it('warehouse CAN write challans/purchases/products', async () => {
    const db = asUser(`${COMPANY_A}-warehouse`);
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/challans/dc1`).set({ number: 'DC1', updatedAt: new Date().toISOString() }));
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/products/p1`).set({ name: 'Widget', updatedAt: new Date().toISOString() }));
  });

  it('warehouse CANNOT write customers/suppliers (read-only for warehouse)', async () => {
    const db = asUser(`${COMPANY_A}-warehouse`);
    await assertFails(db.doc(`companies/${COMPANY_A}/customers/c1`).set({ name: 'X', updatedAt: new Date().toISOString() }));
  });

  it('warehouse CANNOT approve/edit invoices', async () => {
    const db = asUser(`${COMPANY_A}-warehouse`);
    await assertFails(db.doc(`companies/${COMPANY_A}/invoices/inv1`).set({ number: 'INV1', status: 'approved', updatedAt: new Date().toISOString() }));
  });

  it('accounts CAN write invoices/purchases/payments/expenses/bank', async () => {
    const db = asUser(`${COMPANY_A}-accounts`);
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/invoices/inv1`).set({ number: 'INV1', updatedAt: new Date().toISOString() }));
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/expenses/e1`).set({ amount: 100, updatedAt: new Date().toISOString() }));
  });

  it('only owner/admin can delete', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      ctx.firestore().doc(`companies/${COMPANY_A}/products/p1`).set({ name: 'Widget', updatedAt: new Date().toISOString() })
    );
    await assertFails(asUser(`${COMPANY_A}-accounts`).doc(`companies/${COMPANY_A}/products/p1`).delete());
    await assertSucceeds(asUser(`${COMPANY_A}-admin`).doc(`companies/${COMPANY_A}/products/p1`).delete());
  });

  it('only owner/admin can edit Company Settings', async () => {
    await assertFails(asUser(`${COMPANY_A}-accounts`).doc(`companies/${COMPANY_A}/settings/branding`).set({ name: 'X', updatedAt: new Date().toISOString() }));
    await assertSucceeds(asUser(`${COMPANY_A}-admin`).doc(`companies/${COMPANY_A}/settings/branding`).set({ name: 'X', updatedAt: new Date().toISOString() }));
  });
});

// ═══ TRIAL / SUBSCRIPTION STATUS ═══
describe('subscription status gates writes, never reads', () => {
  it('expired company: member can still READ', async () => {
    await seedCompany(COMPANY_A, { status: 'expired' });
    await assertSucceeds(asUser(`${COMPANY_A}-owner`).collection(`companies/${COMPANY_A}/customers`).get());
  });

  it('expired company: member CANNOT write', async () => {
    await seedCompany(COMPANY_A, { status: 'expired' });
    await assertFails(
      asUser(`${COMPANY_A}-owner`).doc(`companies/${COMPANY_A}/customers/c1`).set({ name: 'X', updatedAt: new Date().toISOString() })
    );
  });

  it('trial (not yet expired) company: member CAN write', async () => {
    await seedCompany(COMPANY_A, { status: 'trial' });
    await assertSucceeds(
      asUser(`${COMPANY_A}-owner`).doc(`companies/${COMPANY_A}/customers/c1`).set({ name: 'X', updatedAt: new Date().toISOString() })
    );
  });
});

// ═══ MEMBER / INVITE FLOW ═══
describe('team invite flow', () => {
  it('a signed-in user can self-enroll as owner only if they created the company', async () => {
    const uid = 'new-owner';
    const db = asUser(uid);
    await assertSucceeds(db.doc(`companies/new-co`).set({
      id: 'new-co', name: 'New Co', ownerUid: uid, plan: 'trial', status: 'trial',
      trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
    }));
    await assertSucceeds(db.doc(`companies/new-co/members/${uid}`).set({ uid, role: 'owner', status: 'active' }));
  });

  it('a random user cannot self-enroll as owner of an existing company', async () => {
    await seedCompany(COMPANY_A);
    const db = asUser('intruder');
    await assertFails(db.doc(`companies/${COMPANY_A}/members/intruder`).set({ uid: 'intruder', role: 'owner', status: 'active' }));
  });

  it('an invited user can accept and create their member doc with the INVITED role, not a self-chosen one', async () => {
    await seedCompany(COMPANY_A);
    const inviteEmail = 'newhire@test.com';
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      ctx.firestore().doc(`companies/${COMPANY_A}/invites/${inviteEmail}`).set({
        email: inviteEmail, role: 'sales', status: 'pending',
      })
    );
    const db = asUser('newhire-uid', inviteEmail);
    // Must get the invite's role (sales), not something the client makes up.
    await assertFails(db.doc(`companies/${COMPANY_A}/members/newhire-uid`).set({ uid: 'newhire-uid', role: 'admin', status: 'active' }));
    await assertSucceeds(db.doc(`companies/${COMPANY_A}/members/newhire-uid`).set({ uid: 'newhire-uid', role: 'sales', status: 'active' }));
  });

  it('cannot accept an invite addressed to a different email', async () => {
    await seedCompany(COMPANY_A);
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      ctx.firestore().doc(`companies/${COMPANY_A}/invites/someone@test.com`).set({
        email: 'someone@test.com', role: 'sales', status: 'pending',
      })
    );
    const db = asUser('wrong-uid', 'different@test.com');
    await assertFails(db.doc(`companies/${COMPANY_A}/members/wrong-uid`).set({ uid: 'wrong-uid', role: 'sales', status: 'active' }));
  });

  it('admin cannot promote anyone to owner', async () => {
    await seedCompany(COMPANY_A);
    const db = asUser(`${COMPANY_A}-admin`);
    await assertFails(
      db.doc(`companies/${COMPANY_A}/members/${COMPANY_A}-sales`).set({ role: 'owner' }, { merge: true })
    );
  });

  it('admin cannot edit the owner\u2019s own member record', async () => {
    await seedCompany(COMPANY_A);
    const db = asUser(`${COMPANY_A}-admin`);
    await assertFails(
      db.doc(`companies/${COMPANY_A}/members/${COMPANY_A}-owner`).set({ status: 'suspended' }, { merge: true })
    );
  });

  it('only the owner (not admin) can remove a member', async () => {
    await seedCompany(COMPANY_A);
    await assertFails(asUser(`${COMPANY_A}-admin`).doc(`companies/${COMPANY_A}/members/${COMPANY_A}-sales`).delete());
    await assertSucceeds(asUser(`${COMPANY_A}-owner`).doc(`companies/${COMPANY_A}/members/${COMPANY_A}-sales`).delete());
  });
});

// ═══ SUPER ADMIN ═══
describe('super admin allowlist', () => {
  it('a normal user is not a super admin and cannot read the allowlist for someone else', async () => {
    await seedCompany(COMPANY_A);
    const db = asUser(`${COMPANY_A}-owner`);
    await assertFails(db.doc('superadmins/someone-else').get());
  });

  it('nobody can write the superadmins collection from the client, ever', async () => {
    const db = asUser('anyone');
    await assertFails(db.doc('superadmins/anyone').set({ addedAt: new Date().toISOString() }));
  });
});


// ═══ DOCUMENT NUMBER COUNTERS (collision-safe numbering) ═══
describe('document number counters', () => {
  beforeEach(async () => seedCompany(COMPANY_A));
  const ref = (db, prefix = 'INV') => db.doc(`companies/${COMPANY_A}/counters/${prefix}`);
  const val = (n) => ({ n, updatedAt: new Date().toISOString() });

  it('a sales user can start and advance a counter', async () => {
    const db = asUser(`${COMPANY_A}-sales`);
    await assertSucceeds(ref(db).set(val(1006)));
    await assertSucceeds(ref(db).set(val(1007)));
  });

  it('a counter can never go backwards or stay the same', async () => {
    const db = asUser(`${COMPANY_A}-sales`);
    await assertSucceeds(ref(db).set(val(1010)));
    await assertFails(ref(db).set(val(1009)));
    await assertFails(ref(db).set(val(1010)));
  });

  it('a viewer cannot advance a counter', async () => {
    await assertFails(ref(asUser(`${COMPANY_A}-viewer`)).set(val(5)));
  });

  it('a member of another company cannot touch this company\u2019s counters', async () => {
    await seedCompany(COMPANY_B);
    await assertFails(ref(asUser(`${COMPANY_B}-owner`)).set(val(5)));
  });

  it('only known document prefixes are accepted', async () => {
    await assertFails(ref(asUser(`${COMPANY_A}-owner`), 'HACK').set(val(5)));
  });

  it('a counter holds nothing but the number (no extra fields, integer only)', async () => {
    const db = asUser(`${COMPANY_A}-owner`);
    await assertFails(ref(db).set({ ...val(5), extra: 'x' }));
    await assertFails(ref(db).set(val(5.5)));
    await assertFails(ref(db).set(val('6')));
  });

  it('counters cannot be advanced once the company is expired (read-only)', async () => {
    await testEnv.clearFirestore();
    await seedCompany(COMPANY_A, { status: 'expired' });
    await assertFails(ref(asUser(`${COMPANY_A}-owner`)).set(val(5)));
  });

  it('counters can be read by members and cannot be deleted', async () => {
    const db = asUser(`${COMPANY_A}-owner`);
    await assertSucceeds(ref(db).set(val(3)));
    await assertSucceeds(ref(asUser(`${COMPANY_A}-viewer`)).get());
    await assertFails(ref(db).delete());
  });
});

// ═══ SUBSCRIPTION PAYMENT SUBMISSIONS ═══
describe('payment submissions', () => {
  beforeEach(async () => {
    await seedCompany(COMPANY_A);
    await seedCompany(COMPANY_B);
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('superadmins/sa1').set({ addedAt: 'now' });
    });
  });
  const sub = (companyId, uid, txn = 'TX12345678', extra = {}) => ({
    companyId, companyName: 'Test Co', plan: 'starter', amount: 2000, method: 'EasyPaisa',
    transactionId: txn, txnKey: 'txn_' + txn.toLowerCase().replace(/[^a-z0-9]/g, ''), note: '',
    status: 'pending', submittedBy: uid, submittedByEmail: 'o@test.com', createdAt: new Date().toISOString(), ...extra,
  });
  const key = (txn = 'TX12345678') => 'txn_' + txn.toLowerCase().replace(/[^a-z0-9]/g, '');

  it('a member can submit a valid pending payment for their own company', async () => {
    const uid = `${COMPANY_A}-owner`;
    await assertSucceeds(asUser(uid).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, uid)));
  });

  it('the same transaction ID cannot be submitted twice (even by another company)', async () => {
    const a = `${COMPANY_A}-owner`, b = `${COMPANY_B}-owner`;
    await assertSucceeds(asUser(a).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, a)));
    await assertFails(asUser(a).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, a)));
    await assertFails(asUser(b).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_B, b)));
  });

  it('cannot submit for a company you do not belong to', async () => {
    const b = `${COMPANY_B}-owner`;
    await assertFails(asUser(b).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, b)));
  });

  it('cannot submit as already approved, or with a mismatched document ID', async () => {
    const uid = `${COMPANY_A}-owner`;
    await assertFails(asUser(uid).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, uid, 'TX12345678', { status: 'approved' })));
    await assertFails(asUser(uid).doc('paymentSubmissions/txn_somethingelse1').set(sub(COMPANY_A, uid)));
  });

  it('rejects bad amounts, unknown plans, unknown methods and extra fields', async () => {
    const uid = `${COMPANY_A}-owner`;
    const d = (extra, txn = 'TX99999999') => asUser(uid).doc(`paymentSubmissions/${key(txn)}`).set(sub(COMPANY_A, uid, txn, extra));
    await assertFails(d({ amount: 0 }));
    await assertFails(d({ amount: '2000' }));
    await assertFails(d({ plan: 'enterprise' }));
    await assertFails(d({ method: 'Bitcoin' }));
    await assertFails(d({ isAdminApproved: true }));
  });

  it('a company can read only its own submissions', async () => {
    const a = `${COMPANY_A}-owner`, b = `${COMPANY_B}-owner`;
    await assertSucceeds(asUser(a).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, a)));
    await assertSucceeds(asUser(a).doc(`paymentSubmissions/${key()}`).get());
    await assertFails(asUser(b).doc(`paymentSubmissions/${key()}`).get());
  });

  it('a company cannot approve its own payment; only Super Admin can', async () => {
    const a = `${COMPANY_A}-owner`;
    await assertSucceeds(asUser(a).doc(`paymentSubmissions/${key()}`).set(sub(COMPANY_A, a)));
    await assertFails(asUser(a).doc(`paymentSubmissions/${key()}`).set({ status: 'approved' }, { merge: true }));
    await assertSucceeds(asUser('sa1').doc(`paymentSubmissions/${key()}`).set({ status: 'approved' }, { merge: true }));
  });

  it('a company cannot activate its own subscription by editing the company document', async () => {
    await assertFails(asUser(`${COMPANY_A}-owner`).doc(`companies/${COMPANY_A}`).set({ status: 'active', plan: 'business' }, { merge: true }));
  });
});
