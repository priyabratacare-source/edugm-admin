# EduGM Admin Panel v2

A multi-page static admin workspace for GitHub Pages using Firebase Authentication and Cloud Firestore. It has no public sign-up page.

## Pages
- `index.html` — sign-in
- `dashboard.html` — overview, latest articles, owner pending-account overview
- `articles.html` — all articles, search/filter, author and publish audit details
- `editor.html` — article writing, visual/plain text mode and HTML/code mode
- `users.html` — Owner-only approval and role management
- `categories.html` — add article categories (Owner/Admin)
- `store.html` — EduGM Store catalogue (Owner/Admin)
- `settings.html` — signed-in account details and security checklist

## Deploy to GitHub Pages
1. Download and extract the ZIP.
2. Upload **all files and folders** to the root of your existing `edugm-admin` repository. Keep the `css` and `js` folders.
3. In GitHub, open repository **Settings → Pages**. Choose deploy from branch, `main`, and `/(root)`.
4. Visit `https://priyabratacare-source.github.io/edugm-admin/`.

## Firebase setup
1. In Firebase Console select project `edugm-bangla`.
2. Authentication → Sign-in method → enable Email/Password.
3. Authentication → Users → Add user for each official.
4. Firestore Database → create database → Rules. Paste `firestore.rules` and Publish.
5. Create the initial Owner profile manually in Firestore: collection `users`, document ID exactly equal to the Owner's Firebase Authentication UID, fields:
   - `email`: owner email (string)
   - `role`: `owner` (string)
   - `active`: `true` (boolean)
6. Sign in. Owner can then use **Official users** to add other profiles. First create their Firebase Authentication user and copy their UID; then set their role and active status in the Owner-only page.

Important: because the rules allow user profile writes only to an existing Owner, the first Owner profile must be created manually in the Firebase Console. Do not create a second Owner until the first account works.

## Roles
- **Owner**: all pages, approve/deactivate users, assign roles, article categories, store, edit all articles, delete articles.
- **Admin**: articles, categories and store management; cannot manage users or delete articles in this starter ruleset.
- **Editor**: can create articles and edit articles across authors; cannot manage users, categories or store; cannot delete articles.
- Only active approved profiles can use the admin panel.

## Article audit metadata
The editor records `createdBy/createdByEmail`, `authorId/authorEmail`, `updatedBy/updatedByEmail`, `updatedAt`, and `publishedBy/publishedByEmail/publishedAt`. Firestore timestamps are stored in the database and rendered in the browser's local timezone. Staff edits across authors preserve the original author/creator fields and update the editor metadata.

## HTML/code mode
The editor can save content as text or HTML. Code mode is for article-body HTML, not arbitrary JavaScript. Public article pages should sanitize HTML before rendering; do not directly inject untrusted HTML with `innerHTML` on a public-facing student website.

## Important limitations / next steps
- This is a front-end admin starter, not a complete e-commerce checkout system. Store items are catalogue entries with price and URL; payments/orders are not implemented.
- Category additions and store management require Owner/Admin. Editors can select existing categories.
- The client-side UI is not a security boundary. Firestore Rules are the security enforcement layer; test rules with Firebase Emulator/Rules Playground before launch.
- Do not publish service-account keys, private credentials, or passwords in GitHub. The Firebase web config is intended for browser use; protect data with rules and consider App Check.
- If an existing Firestore database has other collections or stricter rules, review and merge carefully before replacing its rules.


## EduGM logo
The supplied EduGM Learning logo is used on the sign-in page, admin sidebar, and as the browser favicon. It loads from the provided external image URL, so keep that image URL publicly accessible.
