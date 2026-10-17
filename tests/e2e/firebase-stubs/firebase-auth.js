export function getAuth(){return {};}
export function createUserWithEmailAndPassword(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}
export function signInWithEmailAndPassword(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}
export function sendEmailVerification(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}
export function sendPasswordResetEmail(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}
export function setPersistence(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}
export const browserLocalPersistence={};
export const browserSessionPersistence={};
export function onAuthStateChanged(a,cb){setTimeout(()=>cb(null),50);return()=>{};}
export function signOut(){return Promise.resolve({exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach(){}});}