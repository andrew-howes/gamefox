/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Michael Ryan, Brian Marshall
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

var gamefox_accounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = eval(gamefox_lib.prefs.getCharPref('accounts'));
  },

  write: function(accounts)
  {
    gamefox_lib.prefs.setCharPref('accounts', accounts.toSource());
  },

  populate: function()
  {
    var accountList, username, item, firstAccount;
    var currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');

    accountList = document.getElementById('gamefox-accounts-menu');
    if (!accountList)
      return;

    while (accountList.hasChildNodes())
      accountList.removeChild(accountList.firstChild);

    this.read();

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Add account...');
    item.setAttribute('oncommand', 'gamefox_accounts.promptLogin()');
    accountList.appendChild(item);

    firstAccount = true;
    for (username in this.accounts)
    {
      if (firstAccount)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Remove account...');
        item.setAttribute('oncommand', 'gamefox_accounts.promptRemoveAccount()');
        accountList.appendChild(item);
        accountList.appendChild(document.createElement('menuseparator'));
        firstAccount = false;
      }
      item = document.createElement('menuitem');
      item.setAttribute('label', username + 
          (username.toLowerCase() == currentAccount.toLowerCase() ?
           '*' : ''));
      item.setAttribute('oncommand', 'gamefox_accounts.switchAccount("' + username + '")');
      accountList.appendChild(item);
    }
  },

  switchAccount: function(username)
  {
    this.read();
    var account = this.accounts[username];
    var expires = account.MDAAuth.expires;

    if (new Date().getTime() < expires * 1000)
    {
      this.removeCookie('skin');
      this.removeCookie('filesplit');
      this.fetchCtk(fetchCtkCallback);
    }
    else
    {
      this.promptLogin(username, 'Cookie has expired!');
    }

    function fetchCtkCallback()
    {
      gamefox_accounts.loadAccount(
          account.MDAAuth.content,
          account.skin != undefined ? account.skin.content : null,
          account.filesplit != undefined ? account.filesplit.content : null,
          expires);
      gamefox_accounts.loadGameFAQs();
    }
  },

  removeCookie: function(name)
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
        return {content: cookie.value, expires: cookie.expires};
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
    if (Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo)
        .platformVersion.indexOf('1.9') == 0) // Gecko 1.9 (Firefox 3)
    {
      cookieMgr2.add(gamefox_lib.cookieHost, '/', 'MDAAuth', MDAAuth,
          false, false, false, expires);
      if (skin != null)
        cookieMgr2.add(gamefox_lib.cookieHost, '/', 'skin', skin,
            false, false, false, expires);
      if (filesplit != null)
        cookieMgr2.add(gamefox_lib.cookieHost, '/', 'filesplit', filesplit,
            false, false, false, expires);
    }
    else // Gecko 1.8 (Firefox 2)
    {
      cookieMgr2.add(gamefox_lib.cookieHost, '/', 'MDAAuth', MDAAuth,
          false, false, expires);
      if (skin != null)
        cookieMgr2.add(gamefox_lib.cookieHost, '/', 'skin', skin,
            false, false, expires);
      if (filesplit != null)
        cookieMgr2.add(gamefox_lib.cookieHost, '/', 'filesplit', filesplit,
            false, false, expires);
    }
  },

  promptLogin: function(username, error)
  {
    var password = {value: ''};
    var check = {value: true};
    var result;
    if (username == undefined)
    {
      username = {value: ''};
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptUsernameAndPassword(null, 'GameFOX', 'Enter universal username (or e-mail address) and password:', username, password, null, check);
      if (!result)
        return;
      username = username.value.gamefox_trim();
    }
    else
    {
      if (error == undefined)
        error = '';
      else
        error += '\n\n';
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptPassword(null, 'GameFOX', error + 'Enter password for "' + username + '":', password, null, check);
      if (!result)
        return;
    }

    var MDAAuth = this.removeCookie('MDAAuth');
    var skin = this.removeCookie('skin');
    if (skin != null)
      skin = skin.content;
    var filesplit = this.removeCookie('filesplit');
    if (filesplit != null)
      filesplit = filesplit.content;

    this.fetchCtk(fetchCtkCallback);

    function fetchCtkCallback()
    {
      var request = new XMLHttpRequest();
      // TODO: find a way to make page not redirect
      request.open('POST', gamefox_lib.domain + '/user/login.html?r=www.gamefaqs.com/images/default/dot.gif');
      var ds = gamefox_lib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          if (request.responseText.indexOf('<title>Login Error - GameFAQs</title>') != -1)
          {
            if (MDAAuth)
              gamefox_accounts.loadAccount(MDAAuth.content, skin, filesplit, MDAAuth.expires);
            gamefox_accounts.promptLogin(username, 'Login error! Maybe your password was incorrect? Try it again.');
            return;
          }

          var cookie = gamefox_accounts.getCookie('MDAAuth');
          if (cookie == null)
          {
            if (MDAAuth)
              gamefox_accounts.loadAccount(MDAAuth.content, skin, filesplit, MDAAuth.expires);
            gamefox_accounts.promptLogin(username, 'Somebody ate the cookie! This means that something unexpected happened. Try it again.');
            return;
          }

          gamefox_accounts.read();
          gamefox_accounts.accounts[username] = {MDAAuth:{content:cookie.content, expires:cookie.expires}};
          if ((cookie = gamefox_accounts.getCookie('skin')) != null)
            gamefox_accounts.accounts[username].skin = {content:cookie.content};
          if ((cookie = gamefox_accounts.getCookie('filesplit')) != null)
            gamefox_accounts.accounts[username].filesplit = {content:cookie.content};
          gamefox_accounts.write(gamefox_accounts.accounts);

          gamefox_accounts.loadGameFAQs();
        }
      }
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request.send(
          'EMAILADDR=' + gamefox_utils.URLEncode(username) +
          '&PASSWORD=' + gamefox_utils.URLEncode(password.value)
          );
    }
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
    var location = win.content.document.location;

    if (gamefox_lib.onGF(win.content.document))
    {
      if (location.hash)
        win.loadURI(location.href
            .substr(0, location.href.indexOf(location.hash)));
      else
        win.loadURI(location.href);
    }
    else
      win.loadURI(gamefox_lib.domain + gamefox_lib.path + 'index.php');
  }
};
