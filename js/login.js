import { auth, db } from "./firebase.js";
import { $, msg } from "./common.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
const form=$("#login-form"), error=$("#login-error");
onAuthStateChanged(auth, async user=>{if(user){try{const s=await getDoc(doc(db,"users",user.uid));if(s.exists()&&s.data().active===true)location.href="dashboard.html";}catch(e){}}});
form.addEventListener("submit",async e=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;button.textContent="Signing in…";try{const cred=await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value);const snap=await getDoc(doc(db,"users",cred.user.uid));if(!snap.exists()||snap.data().active!==true||!["owner","admin","editor"].includes(snap.data().role)){msg(error,"Your account has not been approved. Contact the EduGM Owner.","error");button.disabled=false;button.textContent="Sign in securely";return;}location.href="dashboard.html";}catch(err){msg(error,"Sign-in failed. Check your email/password and Firebase setup.","error");button.disabled=false;button.textContent="Sign in securely";}});
if(new URLSearchParams(location.search).has("blocked"))msg(error,"This account is not approved for the Admin Panel.","error");
