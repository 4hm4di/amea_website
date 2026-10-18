# AMEA website

Upload everything in this folder to the root of the GitHub repository (index.html at the top level).

## Publish on GitHub Pages
1. Repository Settings > Pages. Source: Deploy from a branch. Branch: main, folder: / (root). Save.
2. Custom domain: amea.ng (the CNAME file already contains it). Save.
3. DNS at your registrar for amea.ng:
   - A records for @: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME for www: 4hm4di.github.io
   - Keep the MX (email) records unchanged.
4. When the DNS check passes, tick Enforce HTTPS.

## Connect the enquiry forms (Google Sheets + email to info@amea.ng)
1. Create a Google Sheet. Extensions > Apps Script. Paste the contents of Code.gs (sent separately). Save.
2. Run the function "setup" once and allow the permissions.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the Web app URL.
4. Paste the URL into assets/js/config.js (FORM_ENDPOINT) and upload that file again.
5. Send a test enquiry: you should see "Enquiry sent", a new row in the Sheet and an email at info@amea.ng.
