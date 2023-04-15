// Saves options to chrome.storage
const saveOptions = () => {
  const apiBaseUrl = document.getElementById('apiBaseUrl').value;
  const appId = document.getElementById('appId').valueAsNumber;
  const dbId = document.getElementById('dbId').valueAsNumber;
  const apiKey = document.getElementById('apiKey').value;

  chrome.storage.sync.set(
    { apiParams: { apiBaseUrl, appId, dbId, apiKey } },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

function reloadEmailPatternListUI(items) {
  const tableBody = document.getElementById('email-patterns-table-body');
  tableBody.innerHTML = "";
  for (const item of items) {
    let tr = document.createElement('tr');
    let tdValue = document.createElement('td');
    let tdDescription = document.createElement('td');
    tdValue.appendChild(document.createTextNode(item.pattern));
    tdDescription.appendChild(document.createTextNode(item.description));
    tr.appendChild(tdValue);
    tr.appendChild(tdDescription);
    tableBody.appendChild(tr);
  }
}

// Restores the state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(['apiParams'],
    (items) => {
      document.getElementById('apiBaseUrl').value = items.apiParams.apiBaseUrl || '';
      document.getElementById('appId').value = items.apiParams.appId || '';
      document.getElementById('dbId').value = items.apiParams.dbId || '';
      document.getElementById('apiKey').value = items.apiParams.apiKey || '';
    }
  );
  chrome.storage.sync.get(['emailPatterns'],
    (items) => {
      reloadEmailPatternListUI(items.emailPatterns);
    }
  )
};

// Request timeout in seconds
const REQUEST_TIME_OUT = 10

/**
 * Generic handle request using fetch API
 * https://developer.mozilla.org/en-US/docs/Web/API/fetch
 * 
 * @param {string} url 
 * @param {object} options
 * @returns 
 */
async function handleRequest(url, options) {
  try {
    const requestOptions = { 
      ...options,
      signal: AbortSignal.timeout(REQUEST_TIME_OUT * 1000),
    }
    const res = await fetch(url, requestOptions);
    if (res.status !== 200) {
      throw new Error('API error!');
    }
    return await res.json();
  } catch (err) {
    let errorMsg = "Error occurred!"
    if (err.name === "TimeoutError") {
      errorMsg = `Timeout: It took more than ${REQUEST_TIME_OUT} seconds to get the result!`;
    } else if (err.name === "AbortError") {
      errorMsg =  "Fetch aborted by user action (browser stop button, closing tab, etc.";
    } else if (err.name === "TypeError") {
      errorMsg = "AbortSignal.timeout() method is not supported";
    } else {
      // A network error, or some other problem.
      errorMsg = `Error: type: ${err.name}, message: ${err.message}`;
    }
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
}

/**
 * Get extension user options (API parameters) from the storage
 * @returns {object}
 */
function get_user_options() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['apiParams'], (items) => resolve(items.apiParams))
  })
}

/**
 * @returns {string[]} a list of allowable email address patterns
 */
async function get_email_patterns_from_app() {
  const appOptions = await get_user_options();
  console.log(appOptions);
  const apiUrl = `${appOptions.apiBaseUrl}/apps/${appOptions.appId}/dbs/${appOptions.dbId}/records?limit=200`;
  const headers = {
    "Authorization": `Bearer ${appOptions.apiKey}`,
    "X-Spiral-App-Role": `user`,
  }
  // const testUrl = `https://jsonplaceholder.typicode.com/photos?_limit=20`;
  const resBody = await handleRequest(apiUrl, { headers })
  return resBody.items.map(x => ({ 
      pattern: x.email_pattern,
      description: x.description,
    })
   );
}

/**
 * Update the list of valid email patterns from the app server
 * and store them on the browser storage
 */
function update_email_patterns_from_app() {
  // Get allowable email addresses from the app server
  get_email_patterns_from_app()
  .then((items) => {
    chrome.storage.sync.set(
      { emailPatterns: items },
      () => {
        alert("Update email addressess success!");
      }
    );
    reloadEmailPatternListUI(items);
  })
  .catch((err) => {
    alert("Cannot update the list of available email addresses", err);
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('update-email-patterns').addEventListener('click', update_email_patterns_from_app);