import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const loginView = $("loginView"), appView = $("appView");
const loginForm = $("loginForm"), loginMessage = $("loginMessage");
const globalMessage = $("globalMessage");
let auth, db, currentUser = null, currentRole = null, articles = [], activeTab = "overview";
let isSaving = false;

function showMessage(el, text, success = false) {
  el.textContent = text;
  el.classList.toggle("success", success);
}
function clearMessage(el) { el.textContent = ""; el.classList.remove("success"); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function dateLabel(ts) {
  if (!ts?.toDate) return "Just now";
  return ts.toDate().toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
}
function canManageAll() { return currentRole === "owner" || currentRole === "admin"; }

function setTab(tab) {
  activeTab = tab;
  ["overview","articles","write"].forEach(name => $(name + "Tab").classList.toggle("hidden", name !== tab));
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
  $("pageTitle").textContent = tab === "write" ? ($("articleId").value ? "Edit article" : "Write article") : tab[0].toUpperCase() + tab.slice(1);
  if (tab === "write" && !$("articleId").value) $("editorTitle").textContent = "Write a new article";
}
function resetEditor() {
  $("articleForm").reset();
  $("articleId").value = "";
  $("editorTitle").textContent = "Write a new article";
  $("editorStatus").textContent = "NEW ARTICLE";
  clearMessage($("saveMessage"));
}
function startNewArticle() { resetEditor(); setTab("write"); }
function editArticle(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;
  if (currentRole === "editor" && article.authorId !== currentUser.uid) {
    showMessage(globalMessage, "Editors can only edit their own articles.");
    return;
  }
  $("articleId").value = article.id;
  $("articleTitle").value = article.title || "";
  $("category").value = article.category || "General";
  $("excerpt").value = article.excerpt || "";
  $("articleContent").value = article.content || "";
  $("editorTitle").textContent = "Edit article";
  $("editorStatus").textContent = article.status === "published" ? "PUBLISHED" : "DRAFT";
  setTab("write");
}
function articleCard(a) {
  const own = a.authorId === currentUser.uid;
  const mayEdit = canManageAll() || own;
  return `<article class="article-row">
    <div class="article-main"><h4>${escapeHtml(a.title || "Untitled article")}</h4>
      <div class="article-meta"><span>${escapeHtml(a.category || "General")}</span><span>•</span><span>Updated ${dateLabel(a.updatedAt || a.createdAt)}</span>${canManageAll() ? `<span>• ${escapeHtml(a.authorEmail || "Official")}</span>` : ""}</div>
    </div><div class="article-side"><span class="status ${a.status === "published" ? "published" : "draft"}">${escapeHtml(a.status || "draft")}</span>
      ${mayEdit ? `<button class="tiny-button" data-edit="${escapeHtml(a.id)}">Edit</button>` : ""}
      ${canManageAll() ? `<button class="tiny-button" data-delete="${escapeHtml(a.id)}">Delete</button>` : ""}
    </div></article>`;
}
function bindArticleButtons(container) {
  container.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => editArticle(btn.dataset.edit)));
  container.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    const article = articles.find(a => a.id === btn.dataset.delete);
    if (!article || !canManageAll()) return;
    if (!confirm(`Delete "${article.title}" permanently?`)) return;
    try {
      await deleteDoc(doc(db, "articles", article.id));
      showMessage(globalMessage, "Article deleted.", true);
      await loadArticles();
    } catch (err) { showMessage(globalMessage, readableError(err)); }
  }));
}
function renderArticles() {
  const queryText = $("articleSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const filtered = articles.filter(a =>
    (!queryText || `${a.title} ${a.excerpt} ${a.category}`.toLowerCase().includes(queryText)) &&
    (status === "all" || a.status === status)
  );
  $("articleCount").textContent = String(articles.length);
  $("totalArticles").textContent = String(articles.length);
  $("publishedArticles").textContent = String(articles.filter(a => a.status === "published").length);
  $("draftArticles").textContent = String(articles.filter(a => a.status !== "published").length);
  $("recentArticles").innerHTML = articles.slice(0, 4).map(articleCard).join("") || '<div class="empty-state">No articles yet. Start by writing your first article.</div>';
  $("allArticles").innerHTML = filtered.map(articleCard).join("") || '<div class="empty-state">No articles match this view.</div>';
  bindArticleButtons($("recentArticles"));
  bindArticleButtons($("allArticles"));
}
async function loadArticles() {
  // Editors read their own drafts and published articles; public reads are not used in this admin view.
  const q = currentRole === "editor"
    ? query(collection(db, "articles"), where("authorId", "==", currentUser.uid), orderBy("updatedAt", "desc"))
    : query(collection(db, "articles"), orderBy("updatedAt", "desc"));
  try {
    const snap = await getDocs(q);
    articles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderArticles();
  } catch (err) {
    articles = [];
    renderArticles();
    showMessage(globalMessage, "Could not load articles. Check that Firestore Rules are installed and indexes/fields are valid. " + readableError(err));
  }
}
function readableError(err) {
  const code = err?.code || "";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) return "Email or password is incorrect.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Wait a while and try again.";
  if (code.includes("permission-denied")) return "Permission denied by Firebase. Ask the owner to check your assigned role and Firestore Rules.";
  if (code.includes("unavailable")) return "Firebase is temporarily unavailable. Check your connection and try again.";
  return err?.message || "Something went wrong. Please try again.";
}
async function saveArticle(status) {
  if (isSaving) return;
  const title = $("articleTitle").value.trim();
  const content = $("articleContent").value.trim();
  if (!title || !content) { showMessage($("saveMessage"), "Enter both a title and article content."); return; }
  if (!currentUser || !currentRole) { showMessage($("saveMessage"), "Your account role could not be verified."); return; }
  const id = $("articleId").value;
  const existing = articles.find(a => a.id === id);
  if (id && !existing) { showMessage($("saveMessage"), "This article is not available in your permitted article list."); return; }
  if (existing && currentRole === "editor" && existing.authorId !== currentUser.uid) {
    showMessage($("saveMessage"), "Editors can only edit their own articles."); return;
  }
  isSaving = true;
  $("saveDraft").disabled = $("publishArticle").disabled = true;
  showMessage($("saveMessage"), "Saving…");
  const now = serverTimestamp();
  const payload = {
    title, category: $("category").value, excerpt: $("excerpt").value.trim(),
    content, status, authorId: existing?.authorId || currentUser.uid,
    authorEmail: existing?.authorEmail || (currentUser.email || ""),
    updatedAt: now
  };
  try {
    if (id && existing) {
      if (status === "published" && existing.status !== "published") payload.publishedAt = now;
      await updateDoc(doc(db, "articles", id), payload);
    } else {
      payload.createdAt = now;
      payload.publishedAt = status === "published" ? now : null;
      await addDoc(collection(db, "articles"), payload);
    }
    showMessage($("saveMessage"), status === "published" ? "Article published successfully." : "Draft saved successfully.", true);
    resetEditor();
    await loadArticles();
    setTab("articles");
  } catch (err) {
    showMessage($("saveMessage"), readableError(err));
  } finally {
    isSaving = false;
    $("saveDraft").disabled = $("publishArticle").disabled = false;
  }
}

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  clearMessage(loginMessage);
  if (!auth) { showMessage(loginMessage, "Add your Firebase config to js/firebase-config.js first."); return; }
  $("loginButton").disabled = true;
  $("loginButton").textContent = "Signing in…";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    // onAuthStateChanged performs role verification before displaying the app.
  } catch (err) { showMessage(loginMessage, readableError(err)); }
  finally { $("loginButton").disabled = false; $("loginButton").innerHTML = 'Sign in securely <span>→</span>'; }
});
$("logoutButton").addEventListener("click", () => signOut(auth));
$("newArticleTop").addEventListener("click", startNewArticle);
$("newArticleList").addEventListener("click", startNewArticle);
$("cancelEdit").addEventListener("click", () => { resetEditor(); setTab("articles"); });
$("saveDraft").addEventListener("click", () => saveArticle("draft"));
$("publishArticle").addEventListener("click", () => saveArticle("published"));
$("articleForm").addEventListener("submit", e => { e.preventDefault(); saveArticle("draft"); });
$("articleSearch").addEventListener("input", renderArticles);
$("statusFilter").addEventListener("change", renderArticles);
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  if (btn.dataset.tab === "write") startNewArticle(); else setTab(btn.dataset.tab);
}));
document.querySelectorAll("[data-goto]").forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.goto)));

try {
  if (firebaseConfig.apiKey.startsWith("PASTE_") || firebaseConfig.projectId.startsWith("PASTE_")) {
    showMessage(loginMessage, "Setup required: add your Firebase web config in js/firebase-config.js.");
  } else {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    onAuthStateChanged(auth, async user => {
      currentUser = user;
      if (!user) {
        currentRole = null; articles = [];
        loginView.classList.remove("hidden"); appView.classList.add("hidden");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        if (!["owner", "admin", "editor"].includes(role)) {
          await signOut(auth);
          showMessage(loginMessage, "This account has no active EduGM role. Ask the owner to authorize it.");
          return;
        }
        currentRole = role;
        loginView.classList.add("hidden"); appView.classList.remove("hidden");
        $("userEmail").textContent = user.email || "Official account";
        $("avatar").textContent = (user.email || "E").charAt(0).toUpperCase();
        $("userRole").textContent = role;
        $("roleExplanation").textContent = role === "owner"
          ? "Owner — full article access and role administration through the Firebase Console."
          : role === "admin"
          ? "Admin — manage all articles. Role assignments remain controlled by the owner."
          : "Editor — create, publish and edit your own articles; no role-management access.";
        await loadArticles();
      } catch (err) {
        await signOut(auth);
        showMessage(loginMessage, "Could not verify your role. " + readableError(err));
      }
    });
  }
} catch (err) {
  showMessage(loginMessage, "Firebase initialization failed. Check js/firebase-config.js.");
  console.error(err);
}
