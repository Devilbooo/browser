/**
 * Model for Code.org user information for use from the Maker Browser context.
 * @class User
 */
class User {
  /**
   * @param {string} name - User's display name.  Read-only after it's set here.
   */
  constructor(name) {
    Object.defineProperty(this, 'name', {
      value: name,
      enumerable: true,
    });
  }

  /**
   * Check for the currently signed-in user, by querying the loaded Code.org
   * page in the webview.
   * Assumes access to the Electron document (should be called on Render thread)
   * @return {Promise.<User>} Resolves to an initialized User object if the
   *   current user is signed in on a Code.org page, rejects otherwise.
   */
  static getCurrentUser() {
    const webview = document.querySelector('webview');
    return readRackEnv(webview)
      .then(rackEnv => readCookie(webview, shortNameCookie(rackEnv)))
      .then(shortName => new User(shortName))
      .catch(err => Promise.reject(err));
  }
}

/**
 * @param {WebviewTag} webview
 * @returns {Promise.<string>} resolved to rack env for page loaded in webview
 */
function readRackEnv(webview) {
  return new Promise((resolve, reject) => {
    webview.executeJavaScript('window.dashboard.rack_env', false, (rackEnv) => {
      rackEnv ? resolve(rackEnv) : reject(new Error('No rack_env found'));
    });
  });
}

/**
 * @param {string} rackEnv
 * @return {string} cookie key for current user's short display name
 */
function shortNameCookie(rackEnv) {
  return environmentifyCookie(rackEnv, '_shortName');
}

/**
 * @param {string} rackEnv
 * @param {string} cookieName in production environment
 * @returns {string} cookie key adjusted for given rack environment
 */
function environmentifyCookie(rackEnv, cookieName) {
  if (rackEnv === 'production') {
    return cookieName;
  }
  return `${cookieName}_${rackEnv}`;
}

/**
 * @param {WebviewTag} webview
 * @param {string} cookieName
 * @returns {Promise.<string>} Resolves to cookie value if cookie is found,
 *   otherwise rejects.
 */
function readCookie(webview, cookieName) {
  return new Promise((resolve, reject) => {
    const cookies = webview.getWebContents().session.cookies;
    cookies.get(
      {
        name: cookieName,
        domain: '.code.org',
      },
      (_, foundCookies) => {
        if (foundCookies.length > 0) {
          resolve(foundCookies[0].value);
        } else {
          reject(new Error(`No '${cookieName}' cookie found`));
        }
      }
    );
  });
}

module.exports = User;
