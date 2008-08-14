/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXAccounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefBranch)
        .getCharPref('gamefox.accounts');

    if (this.accounts.replace(/\s/g, '') == '')
      this.accounts = '({})';

    this.accounts = eval(this.accounts);
  },

  write: function(accounts)
  {
    if (typeof(accounts) == 'object')
      accounts = accounts.toSource();

    Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefBranch)
        .setCharPref('gamefox.accounts', accounts);
  },

  populate: function()
  {
    var accountList, username, item;

    accountList = document.getElementById('gamefox-accounts-menu');
    if (!accountList)
      return;

    while (accountList.hasChildNodes())
    {
      accountList.removeChild(accountList.childNodes[0]);
    }

    this.read();

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Add account...');
    item.setAttribute('oncommand', 'GameFOXAccounts.loginAndSaveCookie()');
    accountList.appendChild(item);

    var firstAccount = true;
    for (username in this.accounts)
    {
      if (firstAccount)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Remove account...');
        item.setAttribute('oncommand', 'GameFOXAccounts.promptRemoveAccount()');
        accountList.appendChild(item);
        accountList.appendChild(document.createElement('menuseparator'));
        firstAccount = false;
      }
      item = document.createElement('menuitem');
      item.setAttribute('label', username);
      item.setAttribute('oncommand', 'GameFOXAccounts.switchAccount("' + username + '")');
      accountList.appendChild(item);
    }
  },

  switchAccount: function(username)
  {
    this.read();
    var account = this.accounts[username];
    var expires = account.MDAAuth.expires * 1000;

    var d = new Date();
    if (d.getTime() < expires)
    {
      expires = new Date(Number(expires));
      expires = expires.getTime() / 1000;

      this.removeCookie('skin');
      this.removeCookie('filesplit');
      
      var cookieMgr2 = Components.classes['@mozilla.org/cookiemanager;1']
          .getService(Components.interfaces.nsICookieManager2);
      if (navigator.userAgent.match('rv:1.9')) // mozilla 1.9 (fx3)
      {
        cookieMgr2.add('.gamefaqs.com', '/', 'MDAAuth', account.MDAAuth.content,
            false, true, false, expires);
        if (account.skin != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'skin', account.skin.content,
              false, true, false, expires);
        if (account.filesplit != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'filesplit', account.filesplit.content,
              false, true, false, expires);
      }
      else // mozilla 1.8
      {
        cookieMgr2.add('.gamefaqs.com', '/', 'MDAAuth', account.MDAAuth.content,
            false, false, expires);
        if (account.skin != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'skin', account.skin.content,
              false, false, expires);
        if (account.filesplit != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'filesplit', account.filesplit.content,
              false, false, expires);
      }

      var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
          .getService(Components.interfaces.nsIWindowMediator)
          .getMostRecentWindow('navigator:browser');
      win.loadURI(win.content.document.location.href);
    }
    else
    {
      this.loginAndSaveCookie(username);
    }
  },

  removeCookie: function(name)
  {
    var cookieMgr = Components.classes['@mozilla.org/cookiemanager;1']
        .getService(Components.interfaces.nsICookieManager);
    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
      if (cookie.host == '.gamefaqs.com' && cookie.name == name)
      {
        cookieMgr.remove('.gamefaqs.com', name, cookie.path, false);
        return;
      }
    }
  },

  getCookie: function(name)
  {
    var cookieMgr = Components.classes['@mozilla.org/cookiemanager;1']
        .getService(Components.interfaces.nsICookieManager);
    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
      if (cookie.host == '.gamefaqs.com' && cookie.name == name)
        return {content: cookie.value, expires: cookie.expires};
    }
    return null;
  },

  loginAndSaveCookie: function(username)
  {
    var password = {value: ''};
    var check = {value: true};
    var result;
    if (username == undefined)
    {
      username = {value: ''};
      result = Components.classes['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Components.interfaces.nsIPromptService)
          .promptUsernameAndPassword(null, 'GameFOX', 'Enter universal username and password:', username, password, null, check);
      if (!result)
        return;
      username = username.value;
    }
    else
    {
      result = Components.classes['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Components.interfaces.nsIPromptService)
          .promptPassword(null, 'GameFOX', 'Enter password for "' + username + '":', password, null, check);
      if (!result)
        return;
    }

    this.removeCookie('skin');
    this.removeCookie('filesplit');
    // TODO: maybe restore these if the login fails?

    var request = new XMLHttpRequest();
    request.open('POST', 'http://www.gamefaqs.com/user/login.html');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (/<title>GameFAQs - Login Error<\/title>/.test(request.responseText)) {
          alert('Couldn\'t log in. Maybe your password was incorrect?');
          return;
        }

        var cookie = GameFOXAccounts.getCookie('MDAAuth');
        if (cookie == null)
        {
          alert('Somebody ate the cookie!');
          return;
        }

        GameFOXAccounts.read();
        GameFOXAccounts.accounts[username] = {MDAAuth:{content:cookie.content, expires:cookie.expires}};
        if ((cookie = GameFOXAccounts.getCookie('skin')) != null)
          GameFOXAccounts.accounts[username].skin = {content:cookie.content};
        if ((cookie = GameFOXAccounts.getCookie('filesplit')) != null)
          GameFOXAccounts.accounts[username].filesplit = {content:cookie.content};
        GameFOXAccounts.write(GameFOXAccounts.accounts);

        var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow('navigator:browser');
        win.loadURI(win.content.document.location.href);
      }
    }
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.send(
        'EMAILADDR=' + GameFOXUtils.URLEncode(username) +
        '&PASSWORD=' + GameFOXUtils.URLEncode(password.value)
        );
  },

  promptRemoveAccount: function()
  {
    var account;
    var items = [];
    this.read();
    for (account in this.accounts)
    {
      items.push(account);
    }
    var selected = {};
    var result = Components.classes['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Components.interfaces.nsIPromptService)
        .select(null, 'GameFOX', 'Select username to remove:', items.length, items, selected);
    if (result)
      this.removeAccount(items[selected.value]);
  },

  removeAccount: function(username)
  {
    this.read();
    delete this.accounts[username];
    this.write(this.accounts);
  }
};
