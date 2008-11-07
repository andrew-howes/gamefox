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

var GFaccounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = eval(Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .getCharPref('gamefox.accounts'));
  },

  write: function(accounts)
  {
    Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .setCharPref('gamefox.accounts', accounts.toSource());
  },

  populate: function()
  {
    var accountList, username, item, firstAccount;

    accountList = document.getElementById('gamefox-accounts-menu');
    if (!accountList)
      return;

    while (accountList.hasChildNodes())
      accountList.removeChild(accountList.firstChild);

    this.read();

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Add account...');
    item.setAttribute('oncommand', 'GFaccounts.promptLogin()');
    accountList.appendChild(item);

    firstAccount = true;
    for (username in this.accounts)
    {
      if (firstAccount)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Remove account...');
        item.setAttribute('oncommand', 'GFaccounts.promptRemoveAccount()');
        accountList.appendChild(item);
        accountList.appendChild(document.createElement('menuseparator'));
        firstAccount = false;
      }
      item = document.createElement('menuitem');
      item.setAttribute('label', username);
      item.setAttribute('oncommand', 'GFaccounts.switchAccount("' + username + '")');
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
      GFaccounts.loadAccount(
          account.MDAAuth.content,
          account.skin != undefined ? account.skin.content : null,
          account.filesplit != undefined ? account.filesplit.content : null,
          expires);
      GFaccounts.loadGameFAQs();
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
      if (cookie.host == '.gamefaqs.com' && cookie.name == name)
      {
        cookieMgr.remove('.gamefaqs.com', name, cookie.path, false);
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
      if (cookie.host == '.gamefaqs.com' && cookie.name == name)
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
      cookieMgr2.add('.gamefaqs.com', '/', 'MDAAuth', MDAAuth,
          false, false, false, expires);
      if (skin != null)
        cookieMgr2.add('.gamefaqs.com', '/', 'skin', skin,
            false, false, false, expires);
      if (filesplit != null)
        cookieMgr2.add('.gamefaqs.com', '/', 'filesplit', filesplit,
            false, false, false, expires);
    }
    else // Gecko 1.8 (Firefox 2)
    {
      cookieMgr2.add('.gamefaqs.com', '/', 'MDAAuth', MDAAuth,
          false, false, expires);
      if (skin != null)
        cookieMgr2.add('.gamefaqs.com', '/', 'skin', skin,
            false, false, expires);
      if (filesplit != null)
        cookieMgr2.add('.gamefaqs.com', '/', 'filesplit', filesplit,
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
      username = username.value.trim();
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
      request.open('POST', 'http://www.gamefaqs.com/user/login.html?r=www.gamefaqs.com/images/default/rec.gif');
      GFlib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          if (request.responseText.indexOf('<title>Login Error - GameFAQs</title>') != -1) {
            GFaccounts.loadAccount(MDAAuth.content, skin, filesplit, MDAAuth.expires);
            GFaccounts.promptLogin(username, 'Login error! Maybe your password was incorrect? Try it again.');
            return;
          }

          var cookie = GFaccounts.getCookie('MDAAuth');
          if (cookie == null)
          {
            GFaccounts.loadAccount(MDAAuth.content, skin, filesplit, MDAAuth.expires);
            GFaccounts.promptLogin(username, 'Somebody ate the cookie! This means that something unexpected happened. Try it again.');
            return;
          }

          GFaccounts.read();
          GFaccounts.accounts[username] = {MDAAuth:{content:cookie.content, expires:cookie.expires}};
          if ((cookie = GFaccounts.getCookie('skin')) != null)
            GFaccounts.accounts[username].skin = {content:cookie.content};
          if ((cookie = GFaccounts.getCookie('filesplit')) != null)
            GFaccounts.accounts[username].filesplit = {content:cookie.content};
          GFaccounts.write(GFaccounts.accounts);

          GFaccounts.loadGameFAQs();
        }
      }
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request.send(
          'EMAILADDR=' + GFutils.URLEncode(username) +
          '&PASSWORD=' + GFutils.URLEncode(password.value)
          );
    }
  },

  fetchCtk: function(callback)
  {
    if (this.getCookie('ctk') == null)
    {
      var request = new XMLHttpRequest();
      request.open('HEAD', 'http://www.gamefaqs.com/');
      GFlib.thirdPartyCookieFix(request);
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
      GFlib.alert('"' + items[selected.value] + '" has been removed.');
      if (items.length > 1)
        this.promptRemoveAccount();
    }
  },

  loadGameFAQs: function()
  {
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow('navigator:browser');
    if (GFlib.onGF(win.content.document))
      win.loadURI(win.content.document.location.href);
    else
      win.loadURI('http://www.gamefaqs.com/boards/index.php');
  }
};
