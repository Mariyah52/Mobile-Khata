import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, collectionGroup, doc, getDoc, getDocFromServer, getDocs, setDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged, signOut as fbOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const COLS=['quotations','challans','invoices','salestaxinvoices','commercialbills','purchases','customers','suppliers','products','payments','expenses','bankaccounts','settings'];
let db,auth,_uid,_demo=false;
let CURRENT_COMPANY_ID=null, CURRENT_MEMBER=null; // {role,status} for the signed-in user within their company
const UNSUB={};
const TRIAL_DAYS=14;

// ═══════════════════════════════════════════════
// PLATFORM CONFIG — set ONCE by whoever deploys this SaaS. This is the ONLY
// Firebase project used by every company; tenants are isolated by the
// companies/{companyId}/... path structure + firestore.rules, not by
// separate Firebase projects. Individual companies never see or touch this.
// ═══════════════════════════════════════════════
// Mobile Khata Firebase project — paste the values from Firebase Console →
// Project settings → Your apps → Web app (firebaseConfig).
const SAAS_FIREBASE_CONFIG={
  apiKey:"AIzaSyDnFljQ38cg68MSBYoNYltRWiJlor8J8j0", authDomain:"mobile-khata-b9eb5.firebaseapp.com", projectId:"mobile-khata-b9eb5",
  storageBucket:"mobile-khata-b9eb5.firebasestorage.app", messagingSenderId:"540770328919", appId:"1:540770328919:web:1b5ef86918adce2cd55e12"
};
const isPlatformConfigured=()=>SAAS_FIREBASE_CONFIG.apiKey&&SAAS_FIREBASE_CONFIG.apiKey!=='REPLACE_ME';
// Local-testing fallback so a developer can paste config via the wizard without editing source.
const getCfg=()=>{
  if(isPlatformConfigured())return SAAS_FIREBASE_CONFIG;
  try{const v=localStorage.getItem('saas_fbcfg_dev');return v?JSON.parse(v):null;}catch{return null;}
};
const setCfg=c=>localStorage.setItem('saas_fbcfg_dev',JSON.stringify(c));

window.saveConfig=()=>{
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const cfg={apiKey:g('c_apiKey'),authDomain:g('c_authDomain'),projectId:g('c_projectId'),storageBucket:g('c_storageBucket'),messagingSenderId:g('c_messagingSenderId'),appId:g('c_appId')};
  if(!cfg.apiKey||!cfg.projectId){const e=document.getElementById('cfgErr');e.textContent='API Key and Project ID required.';e.classList.add('show');return;}
  setCfg(cfg);location.reload();
};
window.useDemo=()=>{localStorage.setItem('mk_demo','1');_demo=true;document.getElementById('setupWiz').style.display='none';launchApp(null);};

async function boot(){
  window.fetchSupportNumberFresh=async function(){
    if(!db)return(window.PLATFORM_CONFIG&&window.PLATFORM_CONFIG.supportWhatsapp)||null;
    try{
      const snap=await getDocFromServer(doc(db,'platform','config'));
      if(snap.exists()){
        window.PLATFORM_CONFIG=snap.data();
        try{localStorage.setItem('mk_platform_cfg',JSON.stringify(snap.data()));}catch{}
        return snap.data().supportWhatsapp||null;
      }
    }catch(e){
      console.error('fetchSupportNumberFresh (server) failed, falling back to cache',e);
      try{
        const snap2=await getDoc(doc(db,'platform','config'));
        if(snap2.exists())return snap2.data().supportWhatsapp||null;
      }catch(e2){console.error(e2);}
    }
    return(window.PLATFORM_CONFIG&&window.PLATFORM_CONFIG.supportWhatsapp)||null;
  };
  if(window.applyBranding){applyBranding();applyTheme();}
  if(window.applyI18nTexts)applyI18nTexts();
  if(localStorage.getItem('mk_demo')==='1'){_demo=true;launchApp(null);return;}
  const cfg=getCfg();
  if(!cfg){showWiz();return;}
  try{
    const app=initializeApp(cfg);
    db=getFirestore(app);auth=getAuth(app);
    enableIndexedDbPersistence(db).catch(()=>{});
    // Cached-first so the login screen's WhatsApp link works instantly even
    // before this fetch resolves; refreshed in the background either way.
    try{const cached=localStorage.getItem('mk_platform_cfg');if(cached)window.PLATFORM_CONFIG=JSON.parse(cached);}catch{}
    getDoc(doc(db,'platform','config')).then(snap=>{
      if(snap.exists()){window.PLATFORM_CONFIG=snap.data();try{localStorage.setItem('mk_platform_cfg',JSON.stringify(snap.data()));}catch{}}
    }).catch(()=>{});
    onAuthStateChanged(auth,async u=>{
      if(!u){CURRENT_COMPANY_ID=null;CURRENT_MEMBER=null;window.CURRENT_COMPANY_ID=null;window.CURRENT_MEMBER=null;window.IS_SUPER_ADMIN=false;showLogin();return;}
      if(_registering)return; // registerCompany()/joinCompany() is mid-write — let it finish and launch the app itself, don't race it
      _uid=u.uid;
      try{
        // users/{uid} is only a routing pointer (which company to load) — it is
        // self-writable and NOT an authorization source. The user's actual role
        // is always read from companies/{companyId}/members/{uid}, which only
        // owners/admins can write (see firestore.rules). Never trust the pointer
        // doc's role field for anything permission-related.
        const uDoc=await getDoc(doc(db,'users',u.uid));
        if(!uDoc.exists()){
          toast('⚠️ No company found for this account. Please register your company.');
          if(window.resetLoginButton)resetLoginButton();
          await fbOut(auth);
          showRegisterInternal();
          return;
        }
        const companyId=uDoc.data().companyId;
        const memberDoc=await getDoc(doc(db,'companies',companyId,'members',u.uid));
        if(!memberDoc.exists()||memberDoc.data().status!=='active'){
          toast('⛔ Your access to this company is inactive. Contact your company owner.');
          if(window.resetLoginButton)resetLoginButton();
          await fbOut(auth);
          return;
        }
        const md=memberDoc.data();
        const companySnap=await getDoc(doc(db,'companies',companyId));
        if(companySnap.exists()&&companySnap.data().status==='suspended'){
          document.getElementById('liErr').textContent='Your subscription has expired. Please contact your company administrator.';
          document.getElementById('liErr').style.display='block';
          if(window.resetLoginButton)resetLoginButton();
          await fbOut(auth);
          return;
        }
        CURRENT_COMPANY_ID=companyId; CURRENT_MEMBER={role:md.role||'viewer',status:md.status,name:md.name,email:md.email};
        window.CURRENT_COMPANY_ID=CURRENT_COMPANY_ID; window.CURRENT_MEMBER=CURRENT_MEMBER;
        try{
          const saSnap=await getDoc(doc(db,'superadmins',u.uid));
          window.IS_SUPER_ADMIN=saSnap.exists();
        }catch{window.IS_SUPER_ADMIN=false;}
        document.getElementById('loginScreen').style.display='none';
        launchApp(u);
      }catch(e){console.error(e);toast('⚠️ Could not load your company. Check your connection and reload.');if(window.resetLoginButton)resetLoginButton();}
    });
  }catch(e){console.error(e);showWiz();}
}

function showWiz(){document.getElementById('setupWiz').style.display='block';document.getElementById('loginScreen').style.display='none';document.getElementById('registerScreen').style.display='none';document.getElementById('joinScreen').style.display='none';document.getElementById('mainNav').style.display='none';document.getElementById('app').style.display='none';}
function showLogin(){document.getElementById('loginScreen').style.display='flex';document.getElementById('setupWiz').style.display='none';document.getElementById('registerScreen').style.display='none';document.getElementById('joinScreen').style.display='none';document.getElementById('mainNav').style.display='none';document.getElementById('app').style.display='none';}
function showRegisterInternal(){document.getElementById('registerScreen').style.display='block';document.getElementById('loginScreen').style.display='none';document.getElementById('setupWiz').style.display='none';document.getElementById('joinScreen').style.display='none';document.getElementById('mainNav').style.display='none';document.getElementById('app').style.display='none';window.populateRegisterDropdowns?.();}
window.showLogin=showLogin;
window.showRegister=showRegisterInternal;

function resetLoginButton(){
  _signingIn=false;
  const btn=document.getElementById('liBtn');const btnText=document.getElementById('liBtnText');const spinner=document.getElementById('liBtnSpinner');
  if(btn)btn.disabled=false;
  if(spinner)spinner.style.display='none';
  if(btnText)btnText.textContent=t('signin_button');
}
function resetView(){_view='dashboard';_setTab='info';_settingsDraftsLoaded=false;const vBtn=document.getElementById('voiceCmdBtn');if(vBtn)vBtn.style.display='none';}

let _signingIn=false;
window.signInEmail=async()=>{
  if(_signingIn)return; // guard against double-submit from rapid double-click/double-tap
  const email=document.getElementById('liEmail')?.value?.trim();
  const pass=document.getElementById('liPass')?.value;
  const remember=document.getElementById('liRemember')?.checked!==false;
  const btn=document.getElementById('liBtn');const btnText=document.getElementById('liBtnText');const spinner=document.getElementById('liBtnSpinner');
  const err=document.getElementById('liErr');
  if(!email||!pass){err.textContent=t('err_missing_fields');err.style.display='block';return;}
  _signingIn=true; btn.disabled=true; err.style.display='none';
  if(spinner)spinner.style.display='inline-block';
  if(btnText)btnText.textContent=t('signin_loading');
  try{
    await setPersistence(auth, remember?browserLocalPersistence:browserSessionPersistence);
    await signInWithEmailAndPassword(auth,email,pass);
    // Success: leave the button in its loading state — onAuthStateChanged will
    // swap the whole screen away in a moment, so re-enabling it here would just
    // flash the normal button back for an instant before the redirect anyway.
  }catch(e){
    err.textContent=authErrorMessage(e);
    err.style.display='block';
    resetLoginButton();
  }
};
window.forgotPassword=async()=>{
  const email=document.getElementById('liEmail')?.value?.trim();
  if(!email){toast('⚠️ Enter your email above first, then click "Forgot password?"');return;}
  try{await sendPasswordResetEmail(auth,email);toast('✅ Password reset email sent to '+email);}
  catch(e){toast('❌ '+authErrorMessage(e));}
};
window.doSignOut=async()=>{if(!confirm('Sign out?'))return;Object.values(UNSUB).forEach(u=>u&&u());window.TEAM_MEMBERS=null;window.TEAM_INVITES=null;window.SERVER_AUDIT=null;window.SERVER_ERRORS=null;window.IS_SUPER_ADMIN=false;if(window.resetView)resetView();if(!_demo&&auth)await fbOut(auth);else{localStorage.removeItem('mk_demo');location.reload();}};

// ═══ COMPANY REGISTRATION (customer self-service — creates company + owner user + trial) ═══
function slugify(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,40)||'company';}
let _registering=false;
window.registerCompany=async()=>{
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const err=document.getElementById('rgErr');const btn=document.getElementById('rgBtn');
  const showErr=m=>{err.textContent=m;err.style.display='block';};
  err.style.display='none';
  const company=g('rgCompany'),owner=g('rgOwner'),email=g('rgEmail'),pass=g('rgPass'),pass2=g('rgPass2');
  if(!company||!owner||!email||!pass)return showErr('Company name, owner name, email and password are required.');
  if(pass.length<6)return showErr('Password must be at least 6 characters.');
  if(pass!==pass2)return showErr('Passwords do not match.');
  if(!isPlatformConfigured()&&!getCfg())return showErr('Platform is not connected to Firebase yet — contact the platform owner.');
  btn.textContent='Creating your company…';btn.disabled=true;
  _registering=true; // MUST be set before createUserWithEmailAndPassword — that call signs the user
                      // in immediately and fires onAuthStateChanged in parallel with the writes below;
                      // without this flag, boot()'s handler would see no users/{uid} doc yet (we haven't
                      // written it) and sign the brand-new account back out mid-registration.
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    const uid=cred.user.uid;
    const companyId=slugify(company)+'-'+uid.slice(0,6);
    const now=new Date();
    let trialDays=TRIAL_DAYS;
    try{const cfgSnap=await getDoc(doc(db,'platform','config'));if(cfgSnap.exists()&&cfgSnap.data().trialDays)trialDays=cfgSnap.data().trialDays;}catch{}
    const trialEndsAt=new Date(now.getTime()+trialDays*86400000).toISOString();

    await setDoc(doc(db,'companies',companyId),{
      id:companyId, name:company, ownerUid:uid, phone:g('rgPhone')||'',
      plan:'trial', status:'trial', trialEndsAt, createdAt:now.toISOString(), updatedAt:now.toISOString()
    });
    await setDoc(doc(db,'companies',companyId,'members',uid),{
      uid, name:owner, email, role:'owner', status:'active', joinedAt:now.toISOString(), updatedAt:now.toISOString()
    });
    await setDoc(doc(db,'users',uid),{
      companyId, role:'owner', status:'active', email, updatedAt:now.toISOString()
    });
    // Seed Company Settings branding from what they just entered — no extra step required.
    await setDoc(doc(db,'companies',companyId,'settings','branding'),{
      id:'branding', name:company, ntn:g('rgNTN'), strn:g('rgTax'), address:g('rgAddress'),
      country:g('rgCountry')||'', currency:g('rgCurrency')||'PKR', timezone:g('rgTimezone')||'UTC',
      website:g('rgWebsite'), email, phone:g('rgPhone'), updatedAt:now.toISOString()
    });
    try{await sendEmailVerification(cred.user);}catch{}

    // All writes succeeded — launch the app directly ourselves. onAuthStateChanged
    // already fired once (and was ignored because of _registering) and won't fire
    // again on its own since the auth state itself hasn't changed again.
    _uid=uid; CURRENT_COMPANY_ID=companyId; CURRENT_MEMBER={role:'owner',status:'active',name:owner,email};
    window.CURRENT_COMPANY_ID=CURRENT_COMPANY_ID; window.CURRENT_MEMBER=CURRENT_MEMBER;
    try{const saSnap=await getDoc(doc(db,'superadmins',uid));window.IS_SUPER_ADMIN=saSnap.exists();}catch{window.IS_SUPER_ADMIN=false;}
    _registering=false;
    toast('✅ Company created! 14-day free trial started.');
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('registerScreen').style.display='none';
    launchApp(cred.user);
  }catch(e){
    _registering=false;
    showErr(e.code==='auth/email-already-in-use'?'An account with this email already exists — sign in instead.':'Error: '+e.message);
    btn.textContent='🚀 Create Company & Start Free Trial';btn.disabled=false;
  }
};

// ═══ TEAM MANAGEMENT (owner/admin) ═══
// ═══ ERROR LOGGING — makes production errors visible instead of console-only ═══
// Any active member can write a log entry about their own error (see rules);
// only owner/admin can read the log, from the Audit page.
let _lastErrLog=0;
window.logErrorToFirestore=async function(message,extra){
  try{
    if(!db||!CURRENT_COMPANY_ID)return; // not signed in / demo mode — nothing to log to
    const now=Date.now();
    if(now-_lastErrLog<3000)return; // simple client-side throttle so a repeating error can't flood writes
    _lastErrLog=now;
    await setDoc(doc(collection(db,'companies',CURRENT_COMPANY_ID,'errorlogs')),{
      message:String(message||'').slice(0,500),
      extra:String(extra||'').slice(0,1000),
      page:(window._view||'unknown'),
      user:(window.CURRENT_MEMBER&&(window.CURRENT_MEMBER.name||window.CURRENT_MEMBER.email))||'unknown',
      role:(window.CURRENT_MEMBER&&window.CURRENT_MEMBER.role)||'unknown',
      url:location.href, userAgent:navigator.userAgent,
      createdAt:new Date().toISOString()
    });
  }catch(e){/* logging must never itself throw */}
};
window.addEventListener('error',e=>{
  console.error(e.error||e.message);
  window.logErrorToFirestore(e.message,e.error&&e.error.stack);
});
window.addEventListener('unhandledrejection',e=>{
  console.error(e.reason);
  window.logErrorToFirestore('Unhandled promise rejection: '+(e.reason&&e.reason.message||e.reason),e.reason&&e.reason.stack);
});

window.logAuditToFirestore=async function(entry){
  try{
    if(!db||!CURRENT_COMPANY_ID)return;
    await setDoc(doc(collection(db,'companies',CURRENT_COMPANY_ID,'auditlogs')),entry);
  }catch(e){/* audit mirroring must never block the actual action */}
};
window.loadServerLogs=async function(){
  if(!CURRENT_COMPANY_ID)return;
  try{
    const [aSnap,eSnap]=await Promise.all([
      getDocs(query(collection(db,'companies',CURRENT_COMPANY_ID,'auditlogs'),orderBy('ts','desc'),limit(100))),
      getDocs(query(collection(db,'companies',CURRENT_COMPANY_ID,'errorlogs'),orderBy('createdAt','desc'),limit(50)))
    ]);
    window.SERVER_AUDIT=aSnap.docs.map(d=>({id:d.id,...d.data()}));
    window.SERVER_ERRORS=eSnap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error(e);window.SERVER_AUDIT=[];window.SERVER_ERRORS=[];}
  renderApp();
};

// ═══ SUPER ADMIN — SaaS Control Panel data + actions ═══
// Every write below relies on firestore.rules' isSuperAdmin() check as the
// real gate — these functions don't themselves grant any access, they just
// make the calls; Firestore independently verifies the caller is listed at
// superadmins/{uid} before allowing any of this to succeed.
async function logPlatformAction(action,details){
  try{await setDoc(doc(collection(db,'platformAuditLog')),{action,details:details||'',by:_uid,byEmail:(window.CURRENT_MEMBER&&window.CURRENT_MEMBER.email)||'',ts:new Date().toISOString()});}
  catch(e){console.error('platform audit log failed',e);}
}

window.loadSACompanies=async function(){
  try{
    // Contact phone comes straight off each company's own top-level doc
    // (mirrored there on registration and whenever the company saves its
    // settings — see saveCompanyInfo()) rather than a cross-company lookup
    // into each company's settings subcollection, since Super Admin's read
    // access to the top-level companies collection is already proven, and
    // a collection-group query across every company's settings is not.
    const snap=await getDocs(query(collection(db,'companies'),limit(500)));
    window.SA_COMPANIES=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error(e);window.SA_COMPANIES=[];toast('⚠️ Could not load companies: '+(e.code||e.message));}
  renderApp();
};
window.saSetCompanyStatus=async function(companyId,status){
  if(!confirm(`Set this company's status to "${status}"?`))return;
  try{
    await setDoc(doc(db,'companies',companyId),{status,updatedAt:new Date().toISOString()},{merge:true});
    await logPlatformAction('COMPANY_STATUS_CHANGE',`${companyId} -> ${status}`);
    toast('✅ Company status updated');
    window.loadSACompanies();
  }catch(e){toast('❌ '+(e.code||e.message));}
};
window.saSetCompanyPlan=async function(companyId,plan){
  try{
    await setDoc(doc(db,'companies',companyId),{plan,updatedAt:new Date().toISOString()},{merge:true});
    await logPlatformAction('COMPANY_PLAN_CHANGE',`${companyId} -> ${plan}`);
    toast('✅ Plan updated');
    window.loadSACompanies();
  }catch(e){toast('❌ '+(e.code||e.message));}
};
window.saExtendTrial=async function(companyId,days){
  try{
    const c=(window.SA_COMPANIES||[]).find(x=>x.id===companyId);
    const base=c&&c.trialEndsAt?new Date(c.trialEndsAt):new Date();
    const newDate=new Date(Math.max(base.getTime(),Date.now())+days*86400000).toISOString();
    await setDoc(doc(db,'companies',companyId),{trialEndsAt:newDate,status:'trial',updatedAt:new Date().toISOString()},{merge:true});
    await logPlatformAction('TRIAL_EXTENDED',`${companyId} +${days}d -> ${newDate}`);
    toast('✅ Trial extended');
    window.loadSACompanies();
  }catch(e){toast('❌ '+(e.code||e.message));}
};

window.loadSAMembers=async function(){
  try{
    const snap=await getDocs(query(collectionGroup(db,'members'),limit(1000)));
    window.SA_MEMBERS=snap.docs.map(d=>({id:d.id,companyId:d.ref.parent.parent.id,...d.data()}));
  }catch(e){console.error(e);window.SA_MEMBERS=[];toast('⚠️ Could not load platform users: '+(e.code||e.message));}
  renderApp();
};

window.loadSAPayments=async function(){
  try{
    const snap=await getDocs(query(collection(db,'paymentSubmissions'),orderBy('createdAt','desc'),limit(200)));
    window.SA_PAYMENTS=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error(e);window.SA_PAYMENTS=[];toast('⚠️ Could not load payments: '+(e.code||e.message));}
  renderApp();
};
window.saApprovePayment=async function(subId){
  if(!confirm('Approve this payment and activate the subscription?'))return;
  try{
    const subSnap=await getDoc(doc(db,'paymentSubmissions',subId));
    if(!subSnap.exists())return toast('❌ Submission not found');
    const sub=subSnap.data();
    const newExpiry=new Date(Date.now()+30*86400000).toISOString(); // 30-day cycle from approval
    await setDoc(doc(db,'companies',sub.companyId),{status:'active',plan:sub.plan||'starter',trialEndsAt:newExpiry,updatedAt:new Date().toISOString()},{merge:true});
    await setDoc(doc(db,'paymentSubmissions',subId),{status:'approved',approvedBy:_uid,approvedAt:new Date().toISOString()},{merge:true});
    await logPlatformAction('PAYMENT_APPROVED',`${subId} for ${sub.companyId}`);
    toast('✅ Payment approved, subscription activated');
    window.loadSAPayments();
  }catch(e){toast('❌ '+(e.code||e.message));}
};
window.saRejectPayment=async function(subId){
  const reason=prompt('Reason for rejection (shown to the company):','');
  if(reason===null)return;
  try{
    await setDoc(doc(db,'paymentSubmissions',subId),{status:'rejected',rejectedBy:_uid,rejectedAt:new Date().toISOString(),rejectionReason:reason},{merge:true});
    await logPlatformAction('PAYMENT_REJECTED',subId+(reason?': '+reason:''));
    toast('Payment rejected');
    window.loadSAPayments();
  }catch(e){toast('❌ '+(e.code||e.message));}
};

window.loadSAAuditLog=async function(){
  try{
    const snap=await getDocs(query(collection(db,'platformAuditLog'),orderBy('ts','desc'),limit(200)));
    window.SA_AUDITLOG=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error(e);window.SA_AUDITLOG=[];toast('⚠️ Could not load platform audit log: '+(e.code||e.message));}
  renderApp();
};

window.loadSASystemSettings=async function(){
  try{
    const snap=await getDoc(doc(db,'platform','config'));
    window.SA_CONFIG=snap.exists()?snap.data():{};
  }catch(e){console.error(e);window.SA_CONFIG={};toast('⚠️ Could not load system settings: '+(e.code||e.message));}
  renderApp();
};
window.saSaveSystemSettings=async function(){
  const g=id=>document.getElementById(id)?.value||'';
  try{
    const cfg={trialDays:parseInt(g('sysTrialDays'))||14,supportWhatsapp:g('sysSupportWa').replace(/[^0-9]/g,''),updatedAt:new Date().toISOString()};
    await setDoc(doc(db,'platform','config'),cfg,{merge:true});
    await logPlatformAction('SYSTEM_SETTINGS_UPDATED',JSON.stringify(cfg));
    window.SA_CONFIG=cfg;
    window.PLATFORM_CONFIG=cfg;
    try{localStorage.setItem('mk_platform_cfg',JSON.stringify(cfg));}catch{}
    toast('✅ System settings saved');
    renderApp();
  }catch(e){toast('❌ '+(e.code||e.message));}
};

window.loadTeamData=async function(){
  if(!CURRENT_COMPANY_ID){window.TEAM_MEMBERS=[];window.TEAM_INVITES=[];window.TEAM_ERROR='Not signed into a company.';renderApp();return;}
  try{
    const [mSnap,iSnap]=await Promise.all([
      getDocs(query(collection(db,'companies',CURRENT_COMPANY_ID,'members'),limit(500))),
      getDocs(query(collection(db,'companies',CURRENT_COMPANY_ID,'invites'),limit(500)))
    ]);
    window.TEAM_MEMBERS=mSnap.docs.map(d=>({id:d.id,...d.data()}));
    window.TEAM_INVITES=iSnap.docs.map(d=>({id:d.id,...d.data()})).filter(i=>i.status==='pending');
    window.TEAM_ERROR=null;
  }catch(e){
    console.error('loadTeamData failed:',e);
    window.TEAM_MEMBERS=[]; window.TEAM_INVITES=[]; // never leave undefined — that caused an infinite reload loop
    window.TEAM_ERROR=(e.code||'')+' '+(e.message||'Could not load team data');
    toast('⚠️ Could not load team data: '+(e.code||e.message||'unknown error'));
  }
  renderApp();
};
window.inviteTeamMember=async function(email,role){
  if(!CURRENT_COMPANY_ID)return;
  email=String(email||'').trim().toLowerCase();
  if(!email||!email.includes('@')){toast('⚠️ Enter a valid email');return;}
  if(!['admin','sales','accounts','warehouse','viewer'].includes(role)){toast('⚠️ Pick a role');return;}
  const limit=(typeof planLimits==='function')?planLimits().maxMembers:99;
  const currentCount=(window.TEAM_MEMBERS||[]).length;
  if(currentCount>=limit){toast(`⛔ Your ${planLabel(myPlan())} plan allows up to ${limit} team members. Upgrade to invite more.`);return;}
  try{
    await setDoc(doc(db,'companies',CURRENT_COMPANY_ID,'invites',email),{
      email, role, status:'pending', invitedBy:_uid,
      invitedByName:(window.CURRENT_MEMBER&&window.CURRENT_MEMBER.name)||'', createdAt:new Date().toISOString()
    });
    toast('✅ Invite created — share your Company Code with '+email);
    window.loadTeamData();
  }catch(e){toast('❌ '+e.message);}
};
window.cancelInvite=async function(email){
  if(!confirm('Cancel this invite?'))return;
  try{await deleteDoc(doc(db,'companies',CURRENT_COMPANY_ID,'invites',email));toast('Invite cancelled');window.loadTeamData();}
  catch(e){toast('❌ '+e.message);}
};
window.changeMemberRole=async function(uid,newRole){
  try{await setDoc(doc(db,'companies',CURRENT_COMPANY_ID,'members',uid),{role:newRole,updatedAt:new Date().toISOString()},{merge:true});toast('✅ Role updated');window.loadTeamData();}
  catch(e){toast('❌ '+(e.code==='permission-denied'?"Can't change that member's role.":e.message));}
};
window.removeMember=async function(uid){
  if(!confirm('Remove this team member? They will lose access immediately.'))return;
  try{await deleteDoc(doc(db,'companies',CURRENT_COMPANY_ID,'members',uid));toast('Member removed');window.loadTeamData();}
  catch(e){toast('❌ '+(e.code==='permission-denied'?"Only the owner can remove members.":e.message));}
};

// ═══ JOIN AN EXISTING COMPANY (invited teammate) ═══
window.showJoin=function(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('registerScreen').style.display='none';
  document.getElementById('setupWiz').style.display='none';
  document.getElementById('joinScreen').style.display='block';
};
window.joinCompany=async function(){
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const err=document.getElementById('jnErr');const btn=document.getElementById('jnBtn');
  const showErr=m=>{err.textContent=m;err.style.display='block';};
  err.style.display='none';
  const companyCode=g('jnCode'),name=g('jnName'),email=g('jnEmail'),pass=g('jnPass');
  if(!companyCode||!name||!email||!pass)return showErr('All fields are required.');
  if(pass.length<6)return showErr('Password must be at least 6 characters.');
  btn.textContent='Joining…';btn.disabled=true;
  try{
    const inviteSnap=await getDoc(doc(db,'companies',companyCode,'invites',email.toLowerCase()));
    if(!inviteSnap.exists()||inviteSnap.data().status!=='pending'){
      showErr('No pending invite found for this email at that Company Code. Ask your Owner/Admin to check the invite.');
      btn.textContent='🤝 Join Company';btn.disabled=false;return;
    }
    const role=inviteSnap.data().role;
    _registering=true; // same reason as registerCompany() — see comment there
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    const uid=cred.user.uid; const now=new Date().toISOString();
    await setDoc(doc(db,'companies',companyCode,'members',uid),{uid,name,email,role,status:'active',joinedAt:now,updatedAt:now});
    await setDoc(doc(db,'companies',companyCode,'invites',email.toLowerCase()),{status:'accepted',acceptedAt:now},{merge:true});
    await setDoc(doc(db,'users',uid),{companyId:companyCode,updatedAt:now});
    try{await sendEmailVerification(cred.user);}catch{}

    _uid=uid; CURRENT_COMPANY_ID=companyCode; CURRENT_MEMBER={role,status:'active',name,email};
    window.CURRENT_COMPANY_ID=CURRENT_COMPANY_ID; window.CURRENT_MEMBER=CURRENT_MEMBER;
    try{const saSnap=await getDoc(doc(db,'superadmins',uid));window.IS_SUPER_ADMIN=saSnap.exists();}catch{window.IS_SUPER_ADMIN=false;}
    _registering=false;
    toast('✅ Welcome aboard!');
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('joinScreen').style.display='none';
    launchApp(cred.user);
  }catch(e){
    _registering=false;
    showErr(e.code==='auth/email-already-in-use'?'An account with this email already exists — sign in instead.':'Error: '+e.message);
    btn.textContent='🤝 Join Company';btn.disabled=false;
  }
};

function launchApp(user){
  document.getElementById('mainNav').style.display='block';document.getElementById('app').style.display='block';
  const vBtn=document.getElementById('voiceCmdBtn');if(vBtn&&!window.IS_SUPER_ADMIN)vBtn.style.display='flex';
  if(_demo){
    toast('🧪 Demo mode — data stays on this device only');
    window.DB=localDB;window.FSAVE=localSave;window.FDEL=localDel;
  }else{
    window.DB=STATE;window.FSAVE=fbSave;window.FDEL=fbDel;
    subscribeAll();watchNet();subscribeCompanyDoc();
    if(user){const t=document.getElementById('sTxt');if(t)t.textContent=user.displayName||user.email||'Online';}
  }
  if(window.applyBranding){applyBranding();applyTheme();}
  if(window.IS_SUPER_ADMIN && !_view.startsWith('sa_')) _view='sa_companies';
  renderApp();
}

function colRef(col){return CURRENT_COMPANY_ID?collection(db,'companies',CURRENT_COMPANY_ID,col):collection(db,col);}
// Used by Reset Company Data — the local cache (window.DB) may only hold the
// first 200 docs of a paginated collection, which would silently leave
// documents behind on a "full" reset. This queries Firestore directly.
window.fetchAllIdsInCollection=async function(col){
  try{
    const snap=await getDocs(colRef(col));
    return snap.docs.map(d=>d.id);
  }catch(e){console.error('fetchAllIdsInCollection failed for',col,e);return[];}
};
function docRef(col,id){return CURRENT_COMPANY_ID?doc(db,'companies',CURRENT_COMPANY_ID,col,id):doc(db,col,id);}

// PERFORMANCE: transactional collections grow without bound over a company's
// lifetime, so these are capped at PAGE_SIZE most-recent records via a live
// listener; older history is fetched on demand (loadMoreCol), not eagerly.
// Small, bounded collections (products, customers, suppliers, bank accounts,
// settings) stay as full live listeners since the rest of the app depends on
// having the complete list for autocomplete/lookups/dropdowns.
const PAGE_SIZE=200;
const PAGINATED_COLS=['quotations','challans','invoices','salestaxinvoices','commercialbills','purchases','payments','expenses'];
const LAST_DOC={};
window.HAS_MORE={};

function subscribeAll(){
  COLS.forEach(col=>{
    if(UNSUB[col])UNSUB[col]();
    const isPaginated=PAGINATED_COLS.includes(col);
    const q2=isPaginated?query(colRef(col),orderBy('updatedAt','desc'),limit(PAGE_SIZE)):query(colRef(col),orderBy('updatedAt','desc'));
    UNSUB[col]=onSnapshot(q2,snap=>{
      STATE[col]=snap.docs.map(d=>({id:d.id,...d.data()}));
      if(isPaginated){
        LAST_DOC[col]=snap.docs.length?snap.docs[snap.docs.length-1]:null;
        window.HAS_MORE[col]=snap.docs.length===PAGE_SIZE; // exactly a full page → probably more behind it
      }
      setSyncFill('done');if(window.applyBranding){applyBranding();applyTheme();}renderApp();
    },err=>{console.error(col,err);setSyncFill('error');});
  });
}

// Fetches the next page of older records for a paginated collection and
// appends them (one-time read, not a live listener — history doesn't need
// to update in real time the way the recent window does).
window.loadMoreCol=async function(col){
  if(!LAST_DOC[col])return;
  const btn=document.getElementById('loadMoreBtn_'+col);
  if(btn){btn.textContent='Loading…';btn.disabled=true;}
  try{
    const q2=query(colRef(col),orderBy('updatedAt','desc'),startAfter(LAST_DOC[col]),limit(PAGE_SIZE));
    const snap=await getDocs(q2);
    const more=snap.docs.map(d=>({id:d.id,...d.data()}));
    const existingIds=new Set((STATE[col]||[]).map(d=>d.id));
    STATE[col]=[...(STATE[col]||[]),...more.filter(d=>!existingIds.has(d.id))];
    LAST_DOC[col]=snap.docs.length?snap.docs[snap.docs.length-1]:LAST_DOC[col];
    window.HAS_MORE[col]=snap.docs.length===PAGE_SIZE;
    renderApp();
  }catch(e){console.error(e);toast('⚠️ Could not load more records');if(btn){btn.textContent='⬇️ Load older records';btn.disabled=false;}}
};
// Live subscription/trial status for the signed-in company — drives the trial/expired banner.
function subscribeCompanyDoc(){
  if(!CURRENT_COMPANY_ID)return;
  if(UNSUB._company)UNSUB._company();
  UNSUB._company=onSnapshot(doc(db,'companies',CURRENT_COMPANY_ID),snap=>{
    window.COMPANY_ACCOUNT=snap.exists()?{id:snap.id,...snap.data()}:null;
    renderApp();
  });
}
// Mirrors the company's contact phone onto its own top-level /companies/{id}
// doc (in addition to settings/branding) so the Super Admin Companies tab can
// read it directly. Exposed on window because this is called from
// saveCompanyInfo() in the classic (non-module) <script> block below, which
// doesn't have setDoc/doc in scope — only the module script does.
window.mirrorCompanyPhone=async function(companyId,phone){
  try{await setDoc(doc(db,'companies',companyId),{phone:phone||''},{merge:true});return true;}
  catch(e){console.error('mirror phone to company doc failed',e);return false;}
};
async function fbSave(col,doc2){
  setSyncFill('syncing');
  try{
    await setDoc(docRef(col,doc2.id),{...doc2,updatedAt:new Date().toISOString()});
    setSyncFill('done');
    return true;
  }catch(e){
    setSyncFill('error');
    toast(e.code==='permission-denied'
      ? "⛔ Not saved — you don't have permission for this (check your role, or your company's subscription status)."
      : '❌ Save failed: '+(e.message||'Unknown error'));
    return false;
  }
}
async function fbDel(col,id){
  setSyncFill('syncing');
  try{
    await deleteDoc(docRef(col,id));
    setSyncFill('done');
    return true;
  }catch(e){
    setSyncFill('error');
    toast(e.code==='permission-denied'
      ? "⛔ Not deleted — you don't have permission for this."
      : '❌ Delete failed: '+(e.message||'Unknown error'));
    return false;
  }
}

const LS={g:(k,d=[])=>{try{const v=localStorage.getItem('mk_'+k);return v?JSON.parse(v):d;}catch{return d;}},s:(k,v)=>{try{localStorage.setItem('mk_'+k,JSON.stringify(v));}catch{}}};

// FIX #2: Seed data for demo mode
const SEED_CUSTOMERS=[{id:'PTY-DEMO1',name:'Resident Engineer Hydel Power',phone:'061-696369',ntn:'9020348-8',address:'Shadiwal, Gujrat',email:'',balance:0,updatedAt:new Date().toISOString()},{id:'PTY-DEMO2',name:'Maria Abbas',phone:'03153205484',ntn:'5067369-0',address:'Hanif Mansion Flat 16, Shahnawaz Bhutto Road, Soldier Bazaar, Karachi East',email:'',balance:0,updatedAt:new Date().toISOString()}];
const SEED_PRODUCTS=[{id:'PRD-DEMO1',name:'Pesticide Spray Round Up',unit:'Ltr',saleRate:2850,purchaseRate:2500,stock:200,minStock:20,category:'Pesticide',updatedAt:new Date().toISOString()},{id:'PRD-DEMO2',name:'Fire Pipe',unit:'Nos',saleRate:500,purchaseRate:400,stock:50,minStock:10,category:'Hardware',updatedAt:new Date().toISOString()},{id:'PRD-DEMO3',name:'Safety Gloves',unit:'Pair',saleRate:350,purchaseRate:280,stock:100,minStock:15,category:'Safety',updatedAt:new Date().toISOString()}];

const localDB={
  quotations:LS.g('quotations'),challans:LS.g('challans'),invoices:LS.g('invoices'),salestaxinvoices:LS.g('salestaxinvoices'),commercialbills:LS.g('commercialbills'),purchases:LS.g('purchases'),expenses:LS.g('expenses'),bankaccounts:LS.g('bankaccounts'),
  customers:LS.g('customers').length?LS.g('customers'):SEED_CUSTOMERS,
  suppliers:LS.g('suppliers'),
  products:LS.g('products').length?LS.g('products'):SEED_PRODUCTS,
  payments:LS.g('payments'),
  settings:LS.g('settings')
};
// Save seeds if first time
if(!LS.g('customers').length){LS.s('customers',SEED_CUSTOMERS);}
if(!LS.g('products').length){LS.s('products',SEED_PRODUCTS);}

function localSave(col,doc2){const d=localDB;const idx=d[col].findIndex(x=>x.id===doc2.id);if(idx>=0)d[col][idx]=doc2;else d[col].unshift(doc2);LS.s(col,d[col]);return true;}
function localDel(col,id){localDB[col]=localDB[col].filter(x=>x.id!==id);LS.s(col,localDB[col]);return true;}

function watchNet(){const update=()=>{const on=navigator.onLine;const dot=document.getElementById('sDot');const txt=document.getElementById('sTxt');if(dot)dot.className='dot '+(on?'online':'offline');if(txt)txt.textContent=on?'Online':'Offline — auto-syncs when back';if(!on)toast('📶 Offline mode — auto-syncs when connected');};window.addEventListener('online',update);window.addEventListener('offline',update);update();}

let _st;
window.setSyncFill=s=>{const b=document.getElementById('syncFill');if(!b)return;b.className='sync-fill '+s;clearTimeout(_st);if(s==='done'||s==='error')_st=setTimeout(()=>b.className='sync-fill',1600);};

boot();
