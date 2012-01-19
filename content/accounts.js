/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2011, 2012 Michael Ryan, Brian Marshall
 *
 * This file is part of GameFOX.
 *
 * GameFOX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * GameFOX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GameFOX.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Manages GameFAQs accounts for quick switching
 * @namespace
 */
var gamefox_accounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = gamefox_lib.safeEval(gamefox_lib.getString('accounts'));
  },

  write: function(accounts)
  {
    gamefox_lib.setString('accounts', gamefox_lib.toJSON(accounts));
  },

  switchAccount: function(username)
  {
    var strbundle = document.getElementById('overlay-strings');

    this.read();
    var account = this.accounts[username];

    if (account.MDAAuth)
    { // Cookie-based switching
      var expires = account.MDAAuth.expires;

      if (Date.now() < expires * 1000)
      {
        this.removeCookie('skin');
        this.removeCookie('filesplit');
        this.fetchCtk(function() {
          gamefox_accounts.loadAccount(
            account.MDAAuth.content,
            account.skin != undefined ? account.skin.content : null,
            account.filesplit != undefined ? account.filesplit.content : null,
            expires);
          gamefox_accounts.loadGameFAQs();
        });
      }
      else
        this.promptLogin(username, 'Cookie has expired!');
    }
    else
    { // Password-based switching
      var password = this._getPassword(username);
      if (password == undefined)
      { // Account was cleared from the login manager without being deleted
        // here
        gamefox_accounts.promptLogin(username, strbundle.getString(
              'passwordCleared'));
        return;
      }

      this.login(username, password, function(result, msg) {
        switch (result)
        {
          case 'E_BAD_LOGIN':
            gamefox_accounts.promptLogin(username, strbundle.getString(
                'badSavedLogin'));
            break;
          default: if (msg) gamefox_lib.alert(msg);
        }
      });
    }
  },

  removeCookie: function(name, contentOnly)
  {
    var cookieMgr = Cc['@mozilla.org/cookiemanager;1']
        .getService(Ci.nsICookieManager);
    var e = cookieMgr.enumerator;
    while (e.hasMoreElements())
    {
      var cookie = e.getNext().QueryInterface(Ci.nsICookie);
      if (cookie.host == gamefox_lib.cookieHost && cookie.name == name)
      {
        cookieMgr.remove(gamefox_lib.cookieHost, name, cookie.path, false);
        return contentOnly ? cookie.value :
          { content: cookie.value, expires: cookie.expires };
      }
    }
    return null;
  },

  getCookie: function(name)
  {
    var e = Cc['@mozilla.org/cookiemanager;1']
        .getService(Ci.nsICookieManager)
        .enumerator;
    while (e.hasMoreElements())
    {
      var cookie = e.getNext().QueryInterface(Ci.nsICookie);
      if (cookie.host == gamefox_lib.cookieHost && cookie.name == name)
        return {content: cookie.value, expires: cookie.expires};
    }
    return null;
  },

  loadAccount: function(MDAAuth, skin, filesplit, expires)
  {
    var cookieMgr2 = Cc['@mozilla.org/cookiemanager;1']
      .getService(Ci.nsICookieManager2);
    cookieMgr2.add(gamefox_lib.cookieHost, '/', 'MDAAuth', MDAAuth,
        false, false, false, expires);
    if (skin != null)
      cookieMgr2.add(gamefox_lib.cookieHost, '/', 'skin', skin,
          false, false, false, expires);
    if (filesplit != null)
      cookieMgr2.add(gamefox_lib.cookieHost, '/', 'filesplit', filesplit,
          false, false, false, expires);
  },

  promptLogin: function(username, error)
  {
    if (!gamefox_lib.thirdPartyCookiePreCheck())
      return;

    var strbundle = document.getElementById('overlay-strings');

    var password = {value: ''};
    var check = {value: true};
    var result;
    if (username == undefined)
    { // Prompt for both username and password
      username = {value: ''};
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptUsernameAndPassword(null, 'GameFOX',
              strbundle.getString('enterLogin'), username, password, null,
              check);

      if (result)
        username = username.value.trim();
      else return;
    }
    else
    { // Prompt only for password
      error = (error == undefined ? '' : error + '\n\n');
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptPassword(null, 'GameFOX', error +
              strbundle.getFormattedString('enterPWLogin', [username]),
              password, null, check);

      if (!result) return;
    }

    this.fetchCtk(function() {
      gamefox_accounts.login(username, password.value, function(result, msg) {
        switch (result)
        {
          case 'E_BAD_LOGIN':
          case 'E_OM_NOM_NOM':
            gamefox_accounts.promptLogin(username, msg);
            break;
          case 'SUCCESS':
            // Successful login - save username and password
            gamefox_accounts._saveLogin(username, password.value);

            // Save account to list (just an empty object, since the info is
            // stored in nsILoginManager)
            gamefox_accounts.read();
            gamefox_accounts.accounts[username] = {};
            gamefox_accounts.write(gamefox_accounts.accounts);

            break;
          default:
            gamefox_lib.alert(msg);
        }
      });
    });
  },

  fetchCtk: function(callback)
  {
    if (this.getCookie('ctk') == null)
    {
      var request = new XMLHttpRequest();
      request.open('HEAD', gamefox_lib.domain + '/');
      var ds = gamefox_lib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
          callback();
      }
      request.send(null);
    }
    else
    {
      callback();
    }
  },

  promptRemoveAccount: function()
  {
    var account;
    var items = [];
    this.read();
    for (account in this.accounts)
      items.push(account);
    var selected = {};
    var result = Cc['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Ci.nsIPromptService)
        .select(null, 'GameFOX', 'Select account to remove:', items.length, items, selected);
    if (result)
    {
      delete this.accounts[items[selected.value]];
      this.write(this.accounts);
      gamefox_lib.alert('"' + items[selected.value] + '" has been removed.');
      if (items.length > 1)
        this.promptRemoveAccount();
    }
  },

  loadGameFAQs: function()
  {
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow('navigator:browser');

    if (gamefox_lib.onGF(win.content.document))
    {
      var location = win.content.document.location;
      var uri = (location.hash ? location.href.substr(0, location.href
          .indexOf(location.hash)) : location.href)
        .replace(/(&|\?)action=[^&]*/, '');

      win.loadURI(uri);
    }
    else
      win.loadURI(gamefox_lib.domain + gamefox_lib.path);
  },

  login: function(username, password, callback, cookies, lastTry)
  {
    var strbundle = document.getElementById('overlay-strings');

    if (!callback)
      callback = function(result, msg) {
        if (msg) gamefox_lib.alert(msg);
      };

    // Log out of the current account (if any) before logging in
    if (!cookies)
    {
      cookies = {
        'MDAAuth': this.removeCookie('MDAAuth'),
        'skin': this.removeCookie('skin', true),
        'filesplit': this.removeCookie('filesplit', true)
      };
    }

    var request = new XMLHttpRequest();
    // TODO: find a way to make page not redirect
    request.open('POST', gamefox_lib.domain +
        '/user/login.html?r=www.gamefaqs.com/images/default/dot.gif');
    var ds = gamefox_lib.thirdPartyCookieFix(request);

    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText
            .indexOf('<title>Login Error - GameFAQs</title>') != -1)
        {
          // Update login key
          var oldKey = gamefox_lib.prefs.getCharPref('loginKey');
          var newKey = gamefox_utils.parseFormInput('key',
              request.responseText);

          // Try again if the key sent was incorrect
          if (!lastTry && newKey && oldKey != newKey)
          {
            gamefox_lib.prefs.setCharPref('loginKey', newKey);
            gamefox_accounts.login(username, password, callback, cookies, true);
            return;
          }

          callback('E_BAD_LOGIN', strbundle.getString('badLogin'));
        }
        else if (request.responseText.indexOf(
              '<title>User Login - CAPTCHA Required - GameFAQs</title>')
            != -1)
          callback('E_MANUAL_LOGIN', strbundle
              .getString('manualLoginRequired'));
        else
        {
          // No recognized error, but let's do a sanity check
          if (gamefox_accounts.getCookie('MDAAuth') == null)
            callback('E_OM_NOM_NOM', strbundle.getString('cookieEaten'));
          else
          {
            callback('SUCCESS');

            gamefox_accounts.loadGameFAQs();
            return; // Don't clean up - we have new cookies
          }
        }

        // Clean up after an error by restoring account cookies
        if (cookies['MDAAuth'])
          gamefox_accounts.loadAccount(cookies['MDAAuth'].content,
              cookies['skin'], cookies['filesplit'],
              cookies['MDAAuth'].expires);
      }
    }

    request.setRequestHeader('Content-Type',
        'application/x-www-form-urlencoded');
    request.send(
        'key=' + gamefox_utils.URLEncode(gamefox_lib.prefs
          .getCharPref('loginKey')) +
        '&EMAILADDR=' + gamefox_utils.URLEncode(username) +
        '&PASSWORD=' + gamefox_utils.URLEncode(password)
        );
  },

  /**
   * Save username and password information to nsILoginManager
   *
   * @param {String} username
   * @param {String} password
   * @return {void}
   */
  _saveLogin: function(username, password)
  {
    var loginManager = Cc['@mozilla.org/login-manager;1'].getService(Ci
        .nsILoginManager);
    var nsLoginInfo = new Components.Constructor(
        '@mozilla.org/login-manager/loginInfo;1', Ci.nsILoginInfo, 'init');
    var login = new nsLoginInfo('chrome://gamefox', null, 'GameFAQs Login',
        username, password, '', '');

    try
    {
      loginManager.addLogin(login);
    }
    catch (ex)
    { // Login already exists - modify it
      loginManager.modifyLogin(this._getLogin(username), login);
    }
  },

  /**
   * Retrieve a login object for an account
   *
   * @param {String} username
   * @return {nsILoginInfo} Login object
   */
  _getLogin: function(username)
  {
    var logins = Cc["@mozilla.org/login-manager;1"].getService(Ci
        .nsILoginManager).findLogins({}, 'chrome://gamefox', null,
          'GameFAQs Login');

    // Loop through matching logins to find the right account
    for (var i = 0; i < logins.length; i++)
    {
      if (logins[i].username == username)
        return logins[i];
    }
  },

  /**
   * Retrieve the password for an account
   *
   * @param {String} username
   * @return {String} password (or undefined if not found)
   */
  _getPassword: function(username)
  {
    return (this._getLogin(username) || {}).password;
  }
};
