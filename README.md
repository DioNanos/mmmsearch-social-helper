# mmmsearch-social-helper

Chromium extension for `mmmsearch` that improves `Profile Scan` on difficult social platforms by using the local browser session.

Optimized for:
- Chrome
- Brave
- Edge
- Chromium-compatible browsers

Current V1 scope:
- Instagram
- Facebook

Repository:
- https://github.com/DioNanos/mmmsearch-social-helper

## English

### What it does
When `mmmbuto.com` detects an Instagram or Facebook profile, this extension can:
- open the profile in a background tab
- read public profile fields from the page using your local browser session
- send only extracted profile fields back to `mmmsearch`

### Important
For best results, you should already be logged into **your own account** in the browser.

The extension does **not** send your cookies or credentials to the `mmmsearch` server.
It only returns extracted profile fields such as:
- name
- bio
- avatar
- followers/following/posts
- external link / website

### Install
1. Open `chrome://extensions` or `brave://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder

### Supported sites
Page bridge:
- `https://mmmbuto.com/*`
- `https://www.mmmbuto.com/*`
- `http://localhost/*`
- `http://127.0.0.1/*`

Profile extraction:
- `https://www.instagram.com/*`
- `https://www.facebook.com/*`
- `https://m.facebook.com/*`

### How it works
- `mmmsearch` asks the extension for help only on supported profile targets
- the extension opens the profile locally in your browser
- the page is parsed inside your browser session
- only structured profile data is sent back to the app

### Privacy model
- browser-local extraction
- no credential proxying
- no cookies sent to the server
- request-scoped profile enrichment only

### Status
V1 is ready in repo.
Manual validation in a real browser session is still recommended.

---

## Italiano

### Cosa fa
Quando `mmmbuto.com` rileva un profilo Instagram o Facebook, questa estensione può:
- aprire il profilo in una tab in background
- leggere i campi pubblici del profilo usando la sessione locale del browser
- inviare a `mmmsearch` solo i campi profilo estratti

### Importante
Per funzionare al meglio, devi essere già loggato con **il tuo account** nel browser.

L'estensione **non** invia cookie o credenziali al server di `mmmsearch`.
Ritorna solo dati estratti come:
- nome
- bio
- avatar
- follower/following/post
- link esterno / sito

### Installazione
1. Apri `chrome://extensions` o `brave://extensions`
2. Attiva `Developer mode`
3. Clicca `Load unpacked`
4. Seleziona questa cartella

### Come funziona
- `mmmsearch` chiede aiuto all'estensione solo sui profili supportati
- l'estensione apre il profilo localmente nel tuo browser
- la pagina viene letta dentro la tua sessione browser
- solo i dati strutturati del profilo tornano all'app

### Privacy
- estrazione locale nel browser
- nessun proxy di credenziali
- nessun cookie inviato al server
- arricchimento profilo solo per la singola richiesta

---

## Español

Extensión optimizada para Chrome/Brave/Edge.
Para mejores resultados, debes iniciar sesión con **tu propia cuenta** en el navegador.
La extensión lee localmente perfiles públicos de Instagram/Facebook y envía a `mmmsearch` solo los campos extraídos, nunca cookies o credenciales.

---

## Français

Extension optimisée pour Chrome/Brave/Edge.
Pour de meilleurs résultats, vous devez être connecté avec **votre propre compte** dans le navigateur.
L'extension lit localement les profils publics Instagram/Facebook et n'envoie à `mmmsearch` que les champs extraits, jamais les cookies ni les identifiants.

---

## Deutsch

Erweiterung optimiert für Chrome/Brave/Edge.
Für beste Ergebnisse solltest du mit **deinem eigenen Konto** im Browser eingeloggt sein.
Die Erweiterung liest öffentliche Instagram/Facebook-Profile lokal im Browser und sendet an `mmmsearch` nur die extrahierten Felder, niemals Cookies oder Zugangsdaten.
