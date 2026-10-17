import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

export const $ = (s, root=document) => root.querySelector(s);
export const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const slugify = (s="") => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const fmtDate = v => { if(!v) return "—"; const d = v.toDate ? v.toDate() : new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}); };
export const msg = (el,text,type="") => { if(!el)return; el.textContent=text; el.className="notice"+(type?" "+type:""); };
export async function getProfile(user){ const snap=await getDoc(doc(db,"users",user.uid)); return snap.exists()?{uid:user.uid,...snap.data()}:null; }
export function mountShell(user, profile, current){
 const shell=$("#app-shell"); if(!shell)return;
 const role=(profile?.role||"unassigned").toUpperCase();
 const nav=[["dashboard.html","▦","Dashboard"],["articles.html","▤","Articles"],["editor.html","＋","Write article"],["categories.html","◈","Categories"],["store.html","🛍","EduGM Store"],["settings.html","⚙","Settings"]];
 if(profile?.role==="owner") nav.splice(1,0,["users.html","♙","Official users"]);
 shell.innerHTML=`<aside class="sidebar"><div class="side-brand"><img class="sidebar-logo" src="https://i.ibb.co/1Y82N0n0/Edu-GM-Learning-Logo.png" alt="EduGM Learning logo"><div>EduGM Admin<small style="display:block;font-size:10px;color:#8190a9;font-weight:500">CONTROL CENTRE</small></div></div><div class="nav-label">WORKSPACE</div><nav class="side-nav">${nav.map(([href,icon,label])=>`<a class="${current===href?"active":""}" href="${href}"><span>${icon}</span>${label}</a>`).join("")}</nav><div class="side-bottom"><div class="user-mini">${esc(user.email||"Official user")}<br><b>${esc(role)}</b></div><button id="logout" class="btn" style="width:100%">Sign out</button></div></aside>`;
 $("#logout").addEventListener("click",async()=>{await signOut(auth);location.href="index.html";});
 document.querySelectorAll(".owner-only").forEach(e=>e.classList.toggle("hidden",profile?.role!=="owner"));
}
export async function requireStaff(page){
 return new Promise(resolve=>onAuthStateChanged(auth,async user=>{
   if(!user){location.href="index.html";return;}
   try{const profile=await getProfile(user); if(!profile || profile.active!==true || !["owner","admin","editor"].includes(profile.role)){await signOut(auth);location.href="index.html?blocked=1";return;}
   if(page==="users.html" && profile.role!=="owner"){location.href="dashboard.html";return;}
   mountShell(user,profile,page); resolve({user,profile});
   }catch(e){document.body.innerHTML=`<main style="padding:30px"><h1>Access check failed</h1><p>Check Firestore rules and your user profile.</p><pre>${esc(e.message)}</pre><a href="index.html">Back to sign in</a></main>`;}
 }));
}
export async function getCategories(){const {collection,getDocs,query,orderBy}=await import("https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js");const s=await getDocs(query(collection(db,"categories"),orderBy("name")));return s.docs.map(d=>({id:d.id,...d.data()}));}
