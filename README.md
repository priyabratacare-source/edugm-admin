# EduGM Admin Panel v1

Blue-and-white admin interface for GitHub Pages + Firebase Authentication + Firestore.

## Included
- Email/password official sign-in (no registration UI)
- Owner/Admin/Editor role checks
- Article creation, draft saving, publishing and editing
- Editors can edit only their own articles
- Owner/Admin can edit or delete all articles
- Firestore rules protect the data independently of the UI
- Public reads for published articles so the student website can display them

## Step 1 — Create Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. In Build → Authentication → Sign-in method, enable Email/Password.
3. In Build → Firestore Database, create a database in production mode.
4. Project settings → General → Your apps → Add app (Web). Register EduGM Admin.
5. Copy the Firebase config into `js/firebase-config.js`.

The web config is intended to be public. Do not put service-account JSON, private keys or admin credentials in this repository.

## Step 2 — Add the files to GitHub
1. Create a repository named `edugm-admin`.
2. Upload all files and folders from this package, preserving their paths.
3. In the repository, open Settings → Pages.
4. Under Build and deployment, choose Deploy from a branch; select `main` and `/(root)`, then Save.
5. Wait for GitHub Pages to publish the site. Use the exact URL shown in Settings → Pages.

## Step 3 — Install Firestore rules
1. In Firebase Console → Firestore Database → Rules.
2. Replace the editor contents with the contents of `firestore.rules`.
3. Click Publish.

Do this before creating live content. These rules deliberately prevent all browser-side writes to the `users` role collection.

## Step 4 — Create official accounts
1. Firebase Console → Authentication → Users → Add user.
2. Create the owner's email/password account first.
3. Copy that account's UID from the Authentication Users list.
4. Firestore Database → Data → Start collection; collection ID: `users`.
5. Set the document ID to the exact owner UID. Add field `role` (string) = `owner`.
6. Add a string field `displayName` if desired. It is optional for this starter.
7. Repeat for each Admin or Editor account, using that account's exact Authentication UID and role value `admin` or `editor`.

Role records must be created/changed in the Firebase Console by the project owner. Do not add public role assignment or registration to the website.

## Step 5 — Add authorized domains
Firebase Console → Authentication → Settings → Authorized domains. Add the exact GitHub Pages hostname if it is not already listed (for example, `yourname.github.io`). If using a custom domain, add that hostname too.

## Step 6 — Test the permissions
- Sign in with an authorized Owner account; create a test article, save as draft and publish.
- Create an Editor account and its `users/{UID}` role document; sign in as Editor.
- Confirm Editor can create and publish articles and can edit their own articles.
- Confirm Editor cannot edit/delete another person's article or modify role records.
- Confirm an unassigned account is signed out.
- Test with Firebase Emulator or a separate test project before production changes.

## Security notes
- GitHub Pages is static hosting. Anyone may load the frontend files; authorization is enforced by Firebase.
- Do not put service-account keys, passwords, private credentials or admin SDK secrets in this repository.
- The role system here uses Firestore role documents. For a larger production system, consider custom claims set only by a trusted server/Admin SDK and App Check.
- The public website can read published articles; do not store unpublished drafts or private student data in public-readable documents.
- This starter stores article body as plain text. It does not include image uploads, rich-text editing, audit history, or account management UI yet.
