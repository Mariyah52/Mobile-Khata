// ═══════════════════════════════════════════════════════════════════
// Whole-app language layer: English / Roman Urdu / Urdu.
//
// How it works: the app's screens are written in English. This file keeps a
// dictionary of the English UI texts and translates them in the page itself
// (text, placeholders, tooltips) — the original English is remembered, so
// switching back to English is instant and nothing stored in the database
// is ever translated. Texts that are not in the dictionary stay in English.
//
// To add or fix a translation, edit the DICT list below: [english, roman, urdu].
// Matching ignores capital letters, leading icons (📦 💾 +) and trailing * → ▾.
// ═══════════════════════════════════════════════════════════════════
(function(){
const DICT=[
// ── navigation & menus ──
['Dashboard','Dashboard','ڈیش بورڈ'],
['Quotations','Quotations','کوٹیشنز'],['Quotation','Quotation','کوٹیشن'],
['Challans','Challans','چالان'],['Delivery Challans','Delivery Challans','ڈلیوری چالان'],['Challan','Challan','چالان'],
['Invoices','Invoices','انوائسز'],['Invoice','Invoice','انوائس'],
['Sales Tax Invoice','Sales Tax Invoice','سیلز ٹیکس انوائس'],['Sales Tax Invoices','Sales Tax Invoices','سیلز ٹیکس انوائسز'],
['Commercial Bill','Commercial Bill','کمرشل بل'],['Commercial Bills','Commercial Bills','کمرشل بلز'],
['Purchases','Purchases','خریداری'],['Purchase','Purchase','خریداری'],
['Parties','Parties','پارٹیاں'],['Customers & Suppliers','Customers & Suppliers','گاہک اور سپلائرز'],
['Customers','Customers','گاہک'],['Suppliers','Suppliers','سپلائرز'],['Customer / Supplier','Customer / Supplier','گاہک / سپلائر'],
['Products','Products','پروڈکٹس'],['Products & Stock','Products & Stock','پروڈکٹس اور اسٹاک'],
['Payments','Payments','ادائیگیاں'],['Expenses','Expenses','اخراجات'],
['Ledger','Ledger','کھاتہ'],['Customer Ledger','Customer Ledger','گاہک کا کھاتہ'],
['Bank','Bank','بینک'],['Bank Accounts','Bank Accounts','بینک اکاؤنٹس'],
['Reports','Reports','رپورٹس'],['Audit Log','Audit Log','آڈٹ لاگ'],
['Administration','Administration','انتظامیہ'],['Company Settings','Company Settings','کمپنی سیٹنگز'],
['Billing','Billing','بلنگ'],['Users','Users','صارفین'],['Roles','Roles','کردار'],['Team','Team','ٹیم'],
['Sign Out','Sign Out','سائن آؤٹ'],['Install App','Install App','ایپ انسٹال کریں'],
['Shortcuts','Shortcuts','شارٹ کٹس'],['Online','Online','آن لائن'],['Offline','Offline','آف لائن'],
['Business Workspace','Business Workspace','بزنس ورک اسپیس'],
// ── dashboard ──
['Total Sales','Total Sales','کل فروخت'],['Total Unpaid','Total Unpaid','کل غیر ادا شدہ'],
['Total Received','Total Received','کل وصول شدہ'],['Total Paid Out','Total Paid Out','کل ادا کیا گیا'],
['Pending Deliveries','Pending Deliveries','زیر التواء ڈیلیوریز'],['Pending Payment','Pending Payment','زیر التواء ادائیگی'],
['Sales Docs Made','Sales Docs Made','بنائی گئی سیلز دستاویزات'],['Challans Sent','Challans Sent','بھیجے گئے چالان'],
['Recent Documents','Recent Documents','حالیہ دستاویزات'],['Quick Actions','Quick Actions','فوری کام'],
['Low Stock Alert','Low Stock Alert','کم اسٹاک کا انتباہ'],['Low Stock','Low Stock','کم اسٹاک'],
['All items well stocked!','All items well stocked!','تمام اشیاء کا اسٹاک کافی ہے!'],['All stock good!','All stock good!','اسٹاک ٹھیک ہے!'],
['All paid!','All paid!','سب ادا ہو چکا!'],['No outstanding!','No outstanding!','کوئی بقایا نہیں!'],
['Receivables','Receivables','وصولیاں'],['Unpaid Sales Documents','Unpaid Sales Documents','غیر ادا شدہ سیلز دستاویزات'],
['No documents yet. Create your first!','No documents yet. Create your first!','ابھی کوئی دستاویز نہیں۔ پہلی بنائیں!'],
['No pending challans','No pending challans','کوئی زیر التواء چالان نہیں'],
['Today','Today','آج'],['This Week','This Week','اس ہفتے'],['This Month','This Month','اس مہینے'],['This Year','This Year','اس سال'],['All Time','All Time','تمام وقت'],
// ── buttons ──
['Save','Save','محفوظ کریں'],['Cancel','Cancel','منسوخ کریں'],['Remove','Remove','ہٹائیں'],['Edit','Edit','ترمیم'],['Print','Print','پرنٹ'],
['Delete','Delete','حذف کریں'],['Close','Close','بند کریں'],['Search','Search','تلاش'],['View','View','دیکھیں'],
['Add Customer','Add Customer','گاہک شامل کریں'],['Add Product','Add Product','پروڈکٹ شامل کریں'],
['Add Expense','Add Expense','خرچ شامل کریں'],['Add Account','Add Account','اکاؤنٹ شامل کریں'],['Add Row','Add Row','قطار شامل کریں'],
['Record Payment','Record Payment','ادائیگی درج کریں'],['Save Payment','Save Payment','ادائیگی محفوظ کریں'],
['Save Quotation','Save Quotation','کوٹیشن محفوظ کریں'],['Save Invoice','Save Invoice','انوائس محفوظ کریں'],
['Save Challan','Save Challan','چالان محفوظ کریں'],['Save Company Settings','Save Company Settings','کمپنی سیٹنگز محفوظ کریں'],
['New Quotation','New Quotation','نئی کوٹیشن'],['New Invoice','New Invoice','نئی انوائس'],['New Challan','New Challan','نیا چالان'],
['New Purchase','New Purchase','نئی خریداری'],['New Sales Tax Invoice','New Sales Tax Invoice','نئی سیلز ٹیکس انوائس'],['New Commercial Bill','New Commercial Bill','نیا کمرشل بل'],
['Import CSV/Excel','Import CSV/Excel','CSV/ایکسل امپورٹ کریں'],['Backup','Backup','بیک اپ'],['Resync','Resync','دوبارہ سنک کریں'],
['Try Again','Try Again','دوبارہ کوشش کریں'],['Go to','Go to','جائیں'],['Submit Payment','Submit Payment','ادائیگی جمع کرائیں'],
['Sign In','Sign In','سائن اِن'],['Join Company','Join Company','کمپنی میں شامل ہوں'],
['Need help? Contact Support','Need help? Contact Support','مدد چاہیے؟ سپورٹ سے رابطہ کریں'],
['Need Help? Chat on WhatsApp','Need Help? Chat on WhatsApp','مدد چاہیے؟ واٹس ایپ پر بات کریں'],
['Click to upload','Click to upload','اپ لوڈ کے لیے کلک کریں'],
// ── table headers & document fields ──
['Date','Date','تاریخ'],['Due Date','Due Date','آخری تاریخ'],['Valid Till','Valid Till','میعاد تک'],['Dispatch Date','Dispatch Date','روانگی کی تاریخ'],
['Description','Description','تفصیل'],['Qty','Qty','مقدار'],['Rate','Rate','ریٹ'],['Unit','Unit','یونٹ'],['Total','Total','کل'],['Subtotal','Subtotal','ذیلی کل'],
['Status','Status','حالت'],['Actions','Actions','عمل'],['Name','Name','نام'],['Phone','Phone','فون'],['Email','Email','ای میل'],['Address','Address','پتہ'],
['Balance','Balance','بقایا'],['Balance Due','Balance Due','واجب الادا'],['Tax','Tax','ٹیکس'],['Tax Rate','Tax Rate','ٹیکس کی شرح'],['Discount %','Discount %','رعایت %'],
['Total Invoiced','Total Invoiced','کل انوائس شدہ'],['Total Paid','Total Paid','کل ادا شدہ'],
['Stock','Stock','اسٹاک'],['Current Stock','Current Stock','موجودہ اسٹاک'],['Min Stock','Min Stock','کم از کم اسٹاک'],
['Sale Rate','Sale Rate','فروخت ریٹ'],['Purchase Rate','Purchase Rate','خریداری ریٹ'],['Purch Rate','Purch Rate','خریداری ریٹ'],['Category','Category','قسم'],
['Customer','Customer','گاہک'],['Customer Name','Customer Name','گاہک کا نام'],['Party Name','Party Name','پارٹی کا نام'],['Opening Balance','Opening Balance','ابتدائی بقایا'],
['Method','Method','طریقہ'],['Type','Type','قسم'],['Notes','Notes','نوٹس'],['Notes / Terms','Notes / Terms','نوٹس / شرائط'],
['Items','Items','اشیاء'],['Document Number','Document Number','دستاویز نمبر'],['Details','Details','تفصیلات'],['Bill To','Bill To','بنام'],
['Driver','Driver','ڈرائیور'],['Vehicle No.','Vehicle No.','گاڑی نمبر'],['Amount Received','Amount Received','وصول شدہ رقم'],
['NTN','NTN','این ٹی این'],['NTN/STRN','NTN/STRN','این ٹی این / ایس ٹی آر این'],
['Link Delivery Challans','Link Delivery Challans','ڈیلیوری چالان جوڑیں'],
['Payment Received (from Customer)','Payment Received (from Customer)','گاہک سے وصولی'],['Payment Paid Out (to Supplier)','Payment Paid Out (to Supplier)','سپلائر کو ادائیگی'],
['Type to search — leave blank for a general payment','Type to search — leave blank for a general payment','تلاش کریں — عام ادائیگی کے لیے خالی چھوڑیں'],
// ── statuses & payment methods ──
['Draft','Draft','مسودہ'],['Sent','Sent','بھیجا گیا'],['Approved','Approved','منظور شدہ'],['Rejected','Rejected','مسترد'],['Pending','Pending','زیر التواء'],
['Paid','Paid','ادا شدہ'],['Unpaid','Unpaid','غیر ادا شدہ'],['Partial','Partial','جزوی'],['Delivered','Delivered','پہنچا دیا گیا'],['Dispatched','Dispatched','روانہ'],['Invoiced','Invoiced','انوائس ہو چکی'],
['Cash','Cash','نقد'],['Cheque','Cheque','چیک'],['Bank Transfer','Bank Transfer','بینک ٹرانسفر'],
// ── empty states & messages ──
['No quotations yet. Click','No quotations yet. Click','ابھی کوئی کوٹیشن نہیں۔ کلک کریں'],
['No delivery challans yet. Click','No delivery challans yet. Click','ابھی کوئی چالان نہیں۔ کلک کریں'],
['No invoices yet. Click','No invoices yet. Click','ابھی کوئی انوائس نہیں۔ کلک کریں'],
['No sales tax invoices yet. Click','No sales tax invoices yet. Click','ابھی کوئی سیلز ٹیکس انوائس نہیں۔ کلک کریں'],
['No commercial bills yet. Click','No commercial bills yet. Click','ابھی کوئی کمرشل بل نہیں۔ کلک کریں'],
['No purchases yet. Click','No purchases yet. Click','ابھی کوئی خریداری نہیں۔ کلک کریں'],
['No payments yet.','No payments yet.','ابھی کوئی ادائیگی نہیں۔'],['No expenses yet.','No expenses yet.','ابھی کوئی خرچ نہیں۔'],
['No bank accounts yet.','No bank accounts yet.','ابھی کوئی بینک اکاؤنٹ نہیں۔'],
['Name required.','Name required.','نام ضروری ہے۔'],['Customer name required.','Customer name required.','گاہک کا نام ضروری ہے۔'],
['Add at least one item.','Add at least one item.','کم از کم ایک آئٹم شامل کریں۔'],['Enter valid amount.','Enter valid amount.','درست رقم لکھیں۔'],
['This cannot be undone.','This cannot be undone.','اس عمل کو واپس نہیں کیا جا سکتا۔'],
['Data saves in browser only. Clear browser cache = data lost. Connect Firebase for permanent cloud storage.','Data saves in browser only. Clear browser cache = data lost. Connect Firebase for permanent cloud storage.','ڈیٹا صرف براؤزر میں محفوظ ہے۔ کیش صاف کرنے سے ڈیٹا ختم ہو جائے گا۔'],
['Demo mode — data stays on this device only','Demo mode — data stays on this device only','ڈیمو موڈ — ڈیٹا صرف اسی ڈیوائس پر رہے گا'],
['Search... (Shift+K)','Search... (Shift+K)','تلاش کریں... (Shift+K)'],
// ── company settings ──
['Business Identity','Business Identity','کاروبار کی شناخت'],['Company Info','Company Info','کمپنی کی معلومات'],['Company Name','Company Name','کمپنی کا نام'],
['Business Description','Business Description','کاروبار کی تفصیل'],['Tagline / Motto','Tagline / Motto','ٹیگ لائن'],['Business Registration Number','Business Registration Number','کاروبار کا رجسٹریشن نمبر'],
['Tax & Registration','Tax & Registration','ٹیکس اور رجسٹریشن'],['Tax / STRN Number','Tax / STRN Number','ٹیکس / ایس ٹی آر این نمبر'],
['Contact','Contact','رابطہ'],['Phone Number(s)','Phone Number(s)','فون نمبر'],['Website','Website','ویب سائٹ'],['WhatsApp Number','WhatsApp Number','واٹس ایپ نمبر'],
['City','City','شہر'],['Country','Country','ملک'],['Postal Code','Postal Code','پوسٹل کوڈ'],
['Company Logo','Company Logo','کمپنی لوگو'],['Company Stamp','Company Stamp','کمپنی مہر'],['Authorized Signature','Authorized Signature','مجاز دستخط'],['Stamp','Stamp','مہر'],
['Theme Customization','Theme Customization','تھیم کی تبدیلی'],['Localization','Localization','مقامی ترتیبات'],
['Currency','Currency','کرنسی'],['Timezone','Timezone','ٹائم زون'],['Date Format','Date Format','تاریخ کا انداز'],['Financial Year Starts','Financial Year Starts','مالی سال کا آغاز'],
['Document Number Prefix (optional)','Document Number Prefix (optional)','دستاویز نمبر کا سابقہ (اختیاری)'],
['Danger Zone','Danger Zone','خطرناک زون'],['Reset All Company Data','Reset All Company Data','کمپنی کا تمام ڈیٹا ری سیٹ کریں'],
['Optional','Optional','اختیاری'],
// ── team & billing ──
['Current Plan','Current Plan','موجودہ پلان'],['Plan','Plan','پلان'],['Free Trial','Free Trial','مفت ٹرائل'],['Starter','Starter','اسٹارٹر'],['Business','Business','بزنس'],
['Trial Ends In','Trial Ends In','ٹرائل ختم ہونے میں'],['trial','trial','ٹرائل'],['active','active','فعال'],['expired','expired','ختم'],['suspended','suspended','معطل'],
["What's included","What's included",'پلان میں کیا شامل ہے'],
['Upgrade / Pay for Subscription','Upgrade / Pay for Subscription','اپ گریڈ / سبسکرپشن کی ادائیگی'],
['Amount paid (PKR)','Amount paid (PKR)','ادا کی گئی رقم (PKR)'],['Paid via','Paid via','ادائیگی کا ذریعہ'],['Transaction ID','Transaction ID','ٹرانزیکشن آئی ڈی'],
['Note (optional)','Note (optional)','نوٹ (اختیاری)'],['Your payment history','Your payment history','آپ کی ادائیگیوں کی تاریخ'],
['2. Then submit the transaction ID here:','2. Then submit the transaction ID here:','2۔ پھر ٹرانزیکشن آئی ڈی یہاں جمع کرائیں:'],
['1. Send the payment to:','1. Send the payment to:','1۔ ادائیگی یہاں بھیجیں:'],
['Your plan is activated after the payment is checked (usually within one working day). Each transaction ID can be submitted only once.','Your plan is activated after the payment is checked (usually within one working day). Each transaction ID can be submitted only once.','ادائیگی کی تصدیق کے بعد (عموماً ایک کام کے دن میں) آپ کا پلان فعال ہو جائے گا۔ ہر ٹرانزیکشن آئی ڈی صرف ایک بار جمع ہو سکتی ہے۔'],
['Payment details are not set up yet. Please contact support to get them.','Payment details are not set up yet. Please contact support to get them.','ادائیگی کی تفصیلات ابھی مقرر نہیں۔ براہ کرم سپورٹ سے رابطہ کریں۔'],
['Only the company Owner or Admin can submit a payment.','Only the company Owner or Admin can submit a payment.','صرف کمپنی کا اونر یا ایڈمن ادائیگی جمع کرا سکتا ہے۔'],
['Owner','Owner','اونر'],['Admin','Admin','ایڈمن'],['Sales','Sales','سیلز'],['Accounts','Accounts','اکاؤنٹس'],['Warehouse','Warehouse','گودام'],['Viewer','Viewer','ناظر'],
// ── login / register ──
['Email','Email','ای میل'],['Password','Password','پاس ورڈ'],['Remember me','Remember me','مجھے یاد رکھیں'],['Forgot password?','Forgot password?','پاس ورڈ بھول گئے؟'],
['Sign in to continue','Sign in to continue','جاری رکھنے کے لیے سائن اِن کریں'],['Business. Simplified.','Business. Simplified.','کاروبار۔ آسان۔'],
['New company?','New company?','نئی کمپنی؟'],['Have a team invite?','Have a team invite?','ٹیم کی دعوت ہے؟'],['Already have an account?','Already have an account?','پہلے سے اکاؤنٹ ہے؟'],
['Create your company account','Create your company account','اپنی کمپنی کا اکاؤنٹ بنائیں'],['Create your account','Create your account','اپنا اکاؤنٹ بنائیں'],
['Create Company & Start Free Trial','Create Company & Start Free Trial','کمپنی بنائیں اور مفت ٹرائل شروع کریں'],
['Join your company','Join your company','اپنی کمپنی میں شامل ہوں'],['Company Code','Company Code','کمپنی کوڈ'],
['Owner Name','Owner Name','اونر کا نام'],['Your Name','Your Name','آپ کا نام'],['Your Business Name','Your Business Name','آپ کے کاروبار کا نام'],
['Create Password','Create Password','پاس ورڈ بنائیں'],['Confirm Password','Confirm Password','پاس ورڈ کی تصدیق'],['Min 6 characters','Min 6 characters','کم از کم 6 حروف'],
['One account per business. Your data is completely private to your company.','One account per business. Your data is completely private to your company.','ہر کاروبار کا ایک اکاؤنٹ۔ آپ کا ڈیٹا صرف آپ کی کمپنی کے لیے ہے۔'],
['14-day free trial. No card required. Logo, stamp & signature can be added anytime in Company Settings.','14-day free trial. No card required. Logo, stamp & signature can be added anytime in Company Settings.','14 دن کا مفت ٹرائل۔ کارڈ کی ضرورت نہیں۔ لوگو، مہر اور دستخط بعد میں بھی شامل ہو سکتے ہیں۔'],
['Create your company and start working in minutes.','Create your company and start working in minutes.','اپنی کمپنی بنائیں اور منٹوں میں کام شروع کریں۔'],
];

const norm=s=>String(s).toLowerCase().replace(/\s+/g,' ').trim();
const MAP=new Map();
DICT.forEach(([en,ro,ur])=>MAP.set(norm(en),{roman:ro,ur}));


// Roman Urdu wording where plain English words would not feel natural.
// (Business nouns like Invoice, Challan, Dashboard stay as people already say them.)
const ROMAN_FIX={
'Save':'Save Karein','Cancel':'Cancel Karein','Remove':'Hatayein','Edit':'Tabdeeli','Print':'Print Karein','Delete':'Delete Karein','Close':'Band Karein','Search':'Talash','View':'Dekhein',
'Add Customer':'Customer Shamil Karein','Add Product':'Product Shamil Karein','Add Expense':'Kharcha Shamil Karein','Add Account':'Account Shamil Karein','Add Row':'Row Shamil Karein',
'Record Payment':'Payment Darj Karein','Save Payment':'Payment Save Karein','Save Quotation':'Quotation Save Karein','Save Invoice':'Invoice Save Karein','Save Challan':'Challan Save Karein','Save Company Settings':'Company Settings Save Karein',
'New Quotation':'Nayi Quotation','New Invoice':'Nayi Invoice','New Challan':'Naya Challan','New Purchase':'Nayi Khareedari','New Sales Tax Invoice':'Nayi Sales Tax Invoice','New Commercial Bill':'Naya Commercial Bill',
'Purchases':'Khareedari','Purchase':'Khareedari','Parties':'Parties','Customers':'Customers','Suppliers':'Suppliers','Customers & Suppliers':'Customers aur Suppliers','Payments':'Payments',
'Expenses':'Akhrajat','Ledger':'Khata','Customer Ledger':'Customer ka Khata','Bank Accounts':'Bank Accounts','Reports':'Reports','Audit Log':'Audit Log',
'Administration':'Intezamia','Company Settings':'Company Settings','Billing':'Billing','Users':'Users','Roles':'Roles','Team':'Team','Sign Out':'Sign Out','Install App':'App Install Karein','Shortcuts':'Shortcuts','Online':'Online','Offline':'Offline',
'Total Sales':'Kul Farokht','Total Unpaid':'Kul Baqaya','Total Received':'Kul Wusool Shuda','Total Paid Out':'Kul Ada Kiya Gaya','Pending Deliveries':'Baqaya Deliveries','Pending Payment':'Baqaya Payment',
'Sales Docs Made':'Banaye Gaye Sales Documents','Challans Sent':'Bheje Gaye Challans','Recent Documents':'Haliya Documents','Quick Actions':'Fori Kaam','Low Stock Alert':'Kam Stock ka Alert','Low Stock':'Kam Stock',
'All items well stocked!':'Tamam items ka stock kafi hai!','All stock good!':'Stock theek hai!','All paid!':'Sab ada ho chuka!','No outstanding!':'Koi baqaya nahi!','Receivables':'Wusooliyan',
'Unpaid Sales Documents':'Unpaid Sales Documents','No documents yet. Create your first!':'Abhi koi document nahi. Pehla bana lein!','No pending challans':'Koi baqaya challan nahi',
'Today':'Aaj','This Week':'Is Hafte','This Month':'Is Mahine','This Year':'Is Saal','All Time':'Tamam Waqt',
'Date':'Tareekh','Due Date':'Akhri Tareekh','Valid Till':'Meyaad Tak','Dispatch Date':'Rawangi ki Tareekh','Description':'Tafseel','Qty':'Miqdaar','Rate':'Rate','Unit':'Unit','Total':'Kul','Subtotal':'Zaili Kul',
'Status':'Halat','Actions':'Amal','Name':'Naam','Phone':'Phone','Email':'Email','Address':'Pata','Balance':'Baqaya','Balance Due':'Wajib-ul-Ada','Tax':'Tax','Tax Rate':'Tax ki Sharah','Discount %':'Riayat %',
'Total Invoiced':'Kul Invoiced','Total Paid':'Kul Ada Shuda','Stock':'Stock','Current Stock':'Maujooda Stock','Min Stock':'Kam az Kam Stock','Sale Rate':'Farokht Rate','Purchase Rate':'Khareedari Rate','Purch Rate':'Khareedari Rate','Category':'Qisam',
'Customer':'Customer','Customer Name':'Customer ka Naam','Party Name':'Party ka Naam','Opening Balance':'Ibtidai Baqaya','Method':'Tareeqa','Type':'Qisam','Notes':'Notes','Notes / Terms':'Notes / Sharait',
'Items':'Items','Document Number':'Document Number','Details':'Tafseelat','Bill To':'Banaam','Driver':'Driver','Vehicle No.':'Gaari Number','Amount Received':'Wusool Shuda Raqam',
'Link Delivery Challans':'Delivery Challans Jorein',
'Payment Received (from Customer)':'Customer se Wusooli','Payment Paid Out (to Supplier)':'Supplier ko Adaigi',
'Type to search — leave blank for a general payment':'Talash ke liye likhein — aam payment ke liye khali chorein',
'Draft':'Musawwada','Sent':'Bheja Gaya','Approved':'Manzoor','Rejected':'Mustarad','Pending':'Baqaya','Paid':'Ada Shuda','Unpaid':'Unpaid','Partial':'Juzwi','Delivered':'Pohancha Diya Gaya','Dispatched':'Rawana','Invoiced':'Invoice Ho Chuki',
'Cash':'Cash','Cheque':'Cheque','Bank Transfer':'Bank Transfer',
'No quotations yet. Click':'Abhi koi quotation nahi. Click karein','No delivery challans yet. Click':'Abhi koi challan nahi. Click karein','No invoices yet. Click':'Abhi koi invoice nahi. Click karein',
'No sales tax invoices yet. Click':'Abhi koi sales tax invoice nahi. Click karein','No commercial bills yet. Click':'Abhi koi commercial bill nahi. Click karein','No purchases yet. Click':'Abhi koi khareedari nahi. Click karein',
'No payments yet.':'Abhi koi payment nahi.','No expenses yet.':'Abhi koi kharcha nahi.','No bank accounts yet.':'Abhi koi bank account nahi.',
'Name required.':'Naam zaroori hai.','Customer name required.':'Customer ka naam zaroori hai.','Add at least one item.':'Kam az kam aik item shamil karein.','Enter valid amount.':'Durust raqam likhein.',
'This cannot be undone.':'Is amal ko wapas nahi kiya ja sakta.',
'Data saves in browser only. Clear browser cache = data lost. Connect Firebase for permanent cloud storage.':'Data sirf browser mein save hai. Cache saaf karne se data khatam ho jayega. Hamesha ke liye save karne ke liye Firebase connect karein.',
'Demo mode — data stays on this device only':'Demo mode — data sirf isi device par rahega','Search... (Shift+K)':'Talash karein... (Shift+K)',
'Business Identity':'Karobar ki Shanakht','Company Info':'Company ki Maloomat','Company Name':'Company ka Naam','Business Description':'Karobar ki Tafseel','Tagline / Motto':'Tagline',
'Business Registration Number':'Karobar Registration Number','Tax & Registration':'Tax aur Registration','Tax / STRN Number':'Tax / STRN Number','Contact':'Rabta','Phone Number(s)':'Phone Number','Website':'Website','WhatsApp Number':'WhatsApp Number',
'City':'Shehar','Country':'Mulk','Postal Code':'Postal Code','Company Logo':'Company Logo','Company Stamp':'Company Muhar','Authorized Signature':'Mujaaz Dastakhat','Stamp':'Muhar',
'Theme Customization':'Theme Tabdeeli','Localization':'Maqami Tarteebat','Currency':'Currency','Timezone':'Timezone','Date Format':'Tareekh ka Andaaz','Financial Year Starts':'Maali Saal ka Aaghaz',
'Document Number Prefix (optional)':'Document Number Prefix (ikhtiyari)','Danger Zone':'Khatarnak Zone','Reset All Company Data':'Company ka Tamam Data Reset Karein','Optional':'Ikhtiyari',
'Current Plan':'Maujooda Plan','Plan':'Plan','Free Trial':'Muft Trial','Starter':'Starter','Business':'Business','Trial Ends In':'Trial Khatam Hone Mein','trial':'trial','active':'faal','expired':'khatam','suspended':'muattal',
"What's included":'Plan mein kya shamil hai','Upgrade / Pay for Subscription':'Upgrade / Subscription ki Adaigi','Amount paid (PKR)':'Ada ki gayi raqam (PKR)','Paid via':'Adaigi ka zariya','Transaction ID':'Transaction ID',
'Note (optional)':'Note (ikhtiyari)','Your payment history':'Aap ki payments ki tareekh','Submit Payment':'Payment Jama Karayein',
'2. Then submit the transaction ID here:':'2. Phir transaction ID yahan jama karayein:','1. Send the payment to:':'1. Payment yahan bhejein:',
'Your plan is activated after the payment is checked (usually within one working day). Each transaction ID can be submitted only once.':'Payment check hone ke baad (aam tor par aik working day mein) aap ka plan faal ho jayega. Har transaction ID sirf aik baar jama ho sakti hai.',
'Payment details are not set up yet. Please contact support to get them.':'Payment ki tafseelat abhi set nahi hain. Meherbani karke support se rabta karein.',
'Only the company Owner or Admin can submit a payment.':'Sirf company ka Owner ya Admin payment jama kara sakta hai.',
'Need help? Contact Support':'Madad chahiye? Support se rabta karein','Need Help? Chat on WhatsApp':'Madad chahiye? WhatsApp par baat karein','Click to upload':'Upload ke liye click karein',
'Import CSV/Excel':'CSV/Excel Import Karein','Backup':'Backup','Resync':'Dobara Sync Karein','Try Again':'Dobara Koshish Karein','Go to':'Jayein','Sign In':'Sign In','Join Company':'Company Join Karein',
'Remember me':'Mujhe yaad rakhein','Forgot password?':'Password bhool gaye?','Sign in to continue':'Jaari rakhne ke liye Sign In karein','Business. Simplified.':'Karobar. Aasaan.',
'New company?':'Nayi company?','Have a team invite?':'Team ki dawat hai?','Already have an account?':'Pehle se account hai?','Create your company account':'Apni company ka account banayein','Create your account':'Apna account banayein',
'Create Company & Start Free Trial':'Company Banayein aur Muft Trial Shuru Karein','Join your company':'Apni company join karein','Company Code':'Company Code','Owner Name':'Owner ka Naam','Your Name':'Aap ka Naam','Your Business Name':'Aap ke Karobar ka Naam',
'Create Password':'Password Banayein','Confirm Password':'Password ki Tasdeeq','Min 6 characters':'Kam az kam 6 huroof','Password':'Password',
'One account per business. Your data is completely private to your company.':'Har karobar ka aik account. Aap ka data sirf aap ki company ke liye hai.',
'14-day free trial. No card required. Logo, stamp & signature can be added anytime in Company Settings.':'14 din ka muft trial. Card ki zaroorat nahi. Logo, muhar aur dastakhat baad mein bhi shamil kiye ja sakte hain.',
'Create your company and start working in minutes.':'Apni company banayein aur minton mein kaam shuru karein.',
'Owner':'Owner','Admin':'Admin','Sales':'Sales','Accounts':'Accounts','Warehouse':'Godaam','Viewer':'Viewer',
'Business Workspace':'Business Workspace'
};
Object.keys(ROMAN_FIX).forEach(k=>{const e=MAP.get(norm(k));if(e)e.roman=ROMAN_FIX[k];});

// Texts with numbers in them, e.g. "5 days", "Total Balance: PKR 0.00"
const PATTERNS=[
 [/^(\d+) documents?$/i,{roman:n=>`${n} documents`,ur:n=>`${n} دستاویزات`}],
 [/^(\d+) days?$/i,{roman:n=>`${n} din`,ur:n=>`${n} دن`}],
 [/^(\d+) records \| Total: (.*)$/i,{roman:(a,b)=>`${a} records | Kul: ${b}`,ur:(a,b)=>`${a} ریکارڈ | کل: ${b}`}],
 [/^Total Balance: (.*)$/i,{roman:a=>`Kul Balance: ${a}`,ur:a=>`کل بقایا: ${a}`}],
 [/^Team members: (\d+) \/ (\d+) used$/i,{roman:(a,b)=>`Team members: ${a} / ${b} istemal`,ur:(a,b)=>`ٹیم ممبرز: ${a} / ${b} استعمال`}],
];

let LANG='en';
const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE']);

function lookup(text,lang){
  if(lang==='en')return null;
  const full=norm(text);
  if(!full||!/[a-z]{2}/.test(full))return null;
  let hit=MAP.get(full);
  if(hit)return {out:hit[lang==='ur'?'ur':'roman'],pre:'',post:''};
  for(const [re,f] of PATTERNS){const m=text.trim().match(re);if(m){const fn=f[lang==='ur'?'ur':'roman'];return {out:fn(...m.slice(1)),pre:'',post:''};}}
  // strip leading icons/symbols and trailing * → ▾ : so "💾 Save", "Name *", "Sign in →" still match
  const m=text.match(/^([^A-Za-z0-9؀-ۿ]*)([\s\S]*?)([\s*→▾:]*)$/);
  if(!m)return null;
  hit=MAP.get(norm(m[2]));
  if(!hit)return null;
  return {out:hit[lang==='ur'?'ur':'roman'],pre:m[1],post:m[3]};
}

function translateTextNode(n){
  const p=n.parentElement;
  if(!p||SKIP.has(p.tagName)||p.closest('[data-notr]'))return;
  if(p.tagName==='OPTION'&&!p.hasAttribute('value'))return; // option text doubles as its saved value
  if(p.hasAttribute&&p.hasAttribute('data-i18n'))return;     // login texts are handled by the original applyI18nTexts
  const cur=n.nodeValue;
  // if the app rewrote the text since we last touched it, the new text is the new English original
  if(n.__mkLast===undefined||cur!==n.__mkLast)n.__mkOrig=cur;
  const orig=n.__mkOrig;
  let want=orig;
  const r=lookup(orig,LANG);
  if(r){const lead=(orig.match(/^\s*/)||[''])[0],trail=(orig.match(/\s*$/)||[''])[0];want=lead+r.pre+r.out+r.post+trail;}
  if(want!==cur)n.nodeValue=want;
  n.__mkLast=want;
}
function translateAttrs(el){
  for(const a of ['placeholder','title']){
    if(!el.hasAttribute||!el.hasAttribute(a))continue;
    const k='__mk_'+a, cur=el.getAttribute(a);
    if(el[k+'Last']===undefined||cur!==el[k+'Last'])el[k]=cur;
    const r=lookup(el[k],LANG);
    const want=r?r.pre+r.out+r.post:el[k];
    if(want!==cur)el.setAttribute(a,want);
    el[k+'Last']=want;
  }
}
let busy=false;
function translateTree(root){
  if(busy)return; busy=true;
  try{
    root=root||document.body; if(!root)return;
    if(root.nodeType===3){translateTextNode(root);return;}
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode()))translateTextNode(n);
    if(root.querySelectorAll){translateAttrs(root);root.querySelectorAll('[placeholder],[title]').forEach(translateAttrs);}
  }finally{busy=false;}
}

let queued=false;
function schedule(){ if(queued||LANG==='en')return; queued=true; requestAnimationFrame(()=>{queued=false;translateTree(document.body);}); }
new MutationObserver(()=>{ if(!busy)schedule(); }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});

function applyLang(lang){
  LANG=['roman','ur'].includes(lang)?lang:'en';
  document.__mkTouched=true;
  document.documentElement.lang=LANG==='ur'?'ur':'en';
  document.body.classList.toggle('lang-ur',LANG==='ur');
  const sel=document.getElementById('appLang'); if(sel)sel.value=LANG;
  translateTree(document.body);
}
// Public: used by the language selector and by the login screen's EN/Roman/اردو buttons.
window.mkApplyLanguage=applyLang;
const origSetLang=window.setLang;
window.setLang=function(lang){ if(typeof origSetLang==='function')origSetLang(lang); applyLang(lang); };
window.addEventListener('DOMContentLoaded',()=>applyLang(localStorage.getItem('mk_lang')||'en'));
if(document.readyState!=='loading')applyLang(localStorage.getItem('mk_lang')||'en');
})();
