const URL_PATTERN = /^(?<scheme>http|https):\/\/(?<host>[^\/]+)(?<path>.*)$/
const RECORD_PATH = /^\/.*dbs\/\d+\/records$/
const EMAIL_PATTERN = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const TEXT_DECODER = new TextDecoder('utf-8')
const TEST_ALLOW_EMAIL_VALUES = [
  "^.+@test.com$", "^.+@example.com$"
]
// Request timeout in seconds
const REQUEST_TIME_OUT = 10

// Store list of valid email address patterns
let emailPatterns = []

/**
 * @returns {boolean}
 * @param {string} value 
 */
function is_valid_email(value) {
  if (emailPatterns.length === 0) {
    return TEST_ALLOW_EMAIL_VALUES.some((x) => value.match(x))
  } else {
    return emailPatterns.some((x) => value.match(x.pattern))
  }
}

/**
 * @returns {string || null}
 * @param {Object} jsonBody 
 */
function check_request_body_email_values(jsonBody) {
  for (const value of Object.values(jsonBody)) {
    if (value.match(EMAIL_PATTERN) && !is_valid_email(value))
      return value;
  }
  return null;
}

// Watch for changes to the user's options & apply them
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.emailPatterns?.newValue) {
    emailPatterns = changes.emailPatterns.newValue;
    console.log(changes.emailPatterns.newValue);
  }
});

// Catch requests to validate or show warning
chrome.webRequest.onBeforeRequest.addListener(
  function(requestDetails) {
    const match = requestDetails.url.match(URL_PATTERN);
    const method = requestDetails.method;
    if (!match || 'POST' !== method)
      return;
    
    const path = match.groups.path
    if (path.match(RECORD_PATH)) {
      const body = requestDetails.requestBody.raw;
      if (!Array.isArray(body))
        return;
      if (body.length === 0)
        return;
      
      const requestBody = TEXT_DECODER.decode(body[0].bytes)
      const bodyJson = JSON.parse(requestBody)
      if (bodyJson === null)
        return;
      if (emailPatterns.length === 0) {
        // update_email_patterns_from_app(); // Automatically call API to get email patterns from the app server
        if (window.confirm('There is no allowed email patterns from the app server, please go to the option page of the extension to get them.\nDo you want to process the request?')) {
          return { cancel: false }
        } else {
          return { cancel: true }
        }
      }
      const invalidValue = check_request_body_email_values(bodyJson)
      if (invalidValue) {
        alert(`⚠️ Your value "${invalidValue}" is not allowed!`)
        return { cancel: true };
      }
      return { cancel: false };
    }
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestBody"]
);

console.log("Started")

// Load email patterns from the storage
chrome.storage.sync.get(['emailPatterns'],
  (items) => {
    emailPatterns = items.emailPatterns;
  }
)