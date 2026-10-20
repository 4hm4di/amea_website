/* AMEA website settings.
   FORM_ENDPOINT: paste the Web app URL from your Google Apps Script deployment
   (it looks like https://script.google.com/macros/s/AKfy.../exec). See README.md, "Enquiry forms".
   Until it is set, the forms show a clear "not sent" message with the email address; they never fake success. */
window.AMEA_CONFIG = {
  FORM_ENDPOINT: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
  /* ANALYTICS_ID: your Google Analytics 4 Measurement ID (looks like G-ABC123XYZ).
     Leave it empty and no analytics loads. When set, analytics only runs for
     visitors who allow it in the cookie banner. */
  ANALYTICS_ID: ''
};
