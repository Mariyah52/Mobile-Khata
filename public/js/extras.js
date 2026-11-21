/* ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────
   Real shortcuts for the most common actions, from anywhere on the page
   (only when you're not typing in a text field, so Shift+letter still
   types capitals normally inside forms):
     Shift+N  → click the page's "+ New …" button
     Shift+S  → click the "💾 Save …" button in the open form (if any)
     Shift+K  → jump into the "🔍 Search…" box
     Alt+1..9 → jump straight to the Nth top nav tab (Dashboard,
                Quotations, Challans, … in whatever order they show for
                your role)
     Esc      → close the open modal
   (Ctrl+N/S/K were tried first, but Chrome reserves Ctrl+N — and often
   Ctrl+S — for its own new-window/save-page actions and won't let a page
   override them, which is why they didn't fire reliably.)
   None of this touches any existing button's markup or handlers — it just
   finds what's on screen and simulates a real click. */
(function(){
  function isEditableTarget(el){
    if(!el) return false;
    var tag=(el.tagName||'').toUpperCase();
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return true;
    if(el.isContentEditable) return true;
    return false;
  }

  var SELECTOR='button, [onclick]';

  function isVisible(el){
    var r=el.getBoundingClientRect();
    if(r.width<=0||r.height<=0) return false;
    if(r.bottom<0||r.right<0||r.top>window.innerHeight||r.left>window.innerWidth) return false;
    var style=window.getComputedStyle(el);
    if(style.visibility==='hidden'||style.display==='none'||parseFloat(style.opacity||'1')===0) return false;
    var cx=Math.min(Math.max(r.left+r.width/2,0),window.innerWidth-1);
    var cy=Math.min(Math.max(r.top+r.height/2,0),window.innerHeight-1);
    var top=document.elementFromPoint(cx,cy);
    if(!top) return false;
    return el===top || el.contains(top) || top.contains(el);
  }

  function clickTarget(el){
    if(!el || !el.isConnected) return;
    el.click();
  }

  function topModalScope(){
    if(typeof _mods!=='undefined' && _mods && _mods.length) return _mods[_mods.length-1];
    return document;
  }

  function findNewButton(){
    var btns=Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    for(var i=0;i<btns.length;i++){
      var t=(btns[i].textContent||'').trim();
      if(t.indexOf('+ New')===0 && isVisible(btns[i])) return btns[i];
    }
    return null;
  }

  function findSaveButton(){
    var scope=topModalScope();
    var btns=Array.prototype.slice.call(scope.querySelectorAll(SELECTOR));
    for(var i=0;i<btns.length;i++){
      var t=btns[i].textContent||'';
      if(t.indexOf('💾')!==-1 && isVisible(btns[i])) return btns[i];
    }
    return null;
  }

  function focusSearch(){
    var el=document.getElementById('srch');
    if(el && isVisible(el)){ el.focus(); el.select&&el.select(); return true; }
    return false;
  }

  function goToNavTab(n){
    var tabs=Array.prototype.slice.call(document.querySelectorAll('#navTabs .nav-tab'));
    tabs=tabs.filter(isVisible);
    return tabs[n-1]||null;
  }

  document.addEventListener('keydown',function(e){
    if(e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase()==='n' && !isEditableTarget(document.activeElement)){
      var nb=findNewButton();
      if(nb){ e.preventDefault(); clickTarget(nb); }
      return;
    }
    if(e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase()==='s' && !isEditableTarget(document.activeElement)){
      var sb=findSaveButton();
      if(sb){ e.preventDefault(); clickTarget(sb); }
      return;
    }
    if(e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase()==='k' && !isEditableTarget(document.activeElement)){
      if(focusSearch()) e.preventDefault();
      return;
    }
    if(e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && /^[1-9]$/.test(e.key)){
      var navBtn=goToNavTab(parseInt(e.key,10));
      if(navBtn){ e.preventDefault(); clickTarget(navBtn); }
      return;
    }
    if(e.key==='Escape' && !isEditableTarget(document.activeElement)){
      if(typeof _mods!=='undefined' && _mods && _mods.length){ e.preventDefault(); closeMod(); }
      return;
    }
  }, true);
})();
