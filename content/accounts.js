/* vim: set et sw=2 sts=2 ts=2: */

var GFaccounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .getCharPref('gamefox.accounts');

    if (!/\S/.test(this.accounts))
      this.accounts = '({})';

    this.accounts = eval(this.accounts);
  },

  write: function(accounts)
  {
    if (typeof(accounts) == 'object')
      accounts = accounts.toSource();

    Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .setCharPref('gamefox.accounts', accounts);
  },

  populate: function()
  {
    var accountList, username, item, firstAccount;

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
    item.setAttribute('oncommand', 'GFaccounts.loginAndSaveCookie()');
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

      var cookieMgr2 = Cc['@mozilla.org/cookiemanager;1']
          .getService(Ci.nsICookieManager2);
      if (Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo)
          .platformVersion.indexOf('1.9') == 0) // Gecko 1.9 (Firefox 3)
      {
        cookieMgr2.add('.gamefaqs.com', '/', 'MDAAuth', account.MDAAuth.content,
            false, false, false, expires);
        if (account.skin != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'skin', account.skin.content,
              false, false, false, expires);
        if (account.filesplit != undefined)
          cookieMgr2.add('.gamefaqs.com', '/', 'filesplit', account.filesplit.content,
              false, false, false, expires);
      }
      else // Gecko 1.8
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

      this.loadGameFAQs();
    }
    else
    {
      this.loginAndSaveCookie(username);
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
        return;
      }
    }
  },

  getCookie: function(name)
  {
    var cookieMgr = Cc['@mozilla.org/cookiemanager;1']
        .getService(Ci.nsICookieManager);
    var e = cookieMgr.enumerator;
    while (e.hasMoreElements())
    {
      var cookie = e.getNext().QueryInterface(Ci.nsICookie);
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
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptUsernameAndPassword(null, 'GameFOX', 'Enter universal username (or e-mail address) and password:', username, password, null, check);
      if (!result)
        return;
      username = username.value;
    }
    else
    {
      result = Cc['@mozilla.org/embedcomp/prompt-service;1']
          .getService(Ci.nsIPromptService)
          .promptPassword(null, 'GameFOX', 'Enter password for "' + username + '":', password, null, check);
      if (!result)
        return;
    }

    this.removeCookie('MDAAuth');
    this.removeCookie('skin');
    this.removeCookie('filesplit');
    // TODO: restore these if the login fails
    // TODO: check for ctk cookie and fetch if it's not there

    var request = new XMLHttpRequest();
    request.open('POST', 'http://www.gamefaqs.com/user/login.html');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('<title>Login Error - GameFAQs</title>') != -1) {
          alert('Couldn\'t log in. Maybe your password was incorrect?');
          return;
        }

        var cookie = GFaccounts.getCookie('MDAAuth');
        if (cookie == null)
        {
          alert('Somebody ate the cookie!');
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
    var result = Cc['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Ci.nsIPromptService)
        .select(null, 'GameFOX', 'Select account to remove:', items.length, items, selected);
    if (result)
      this.removeAccount(items[selected.value]);
  },

  removeAccount: function(username)
  {
    this.read();
    delete this.accounts[username];
    this.write(this.accounts);
  },

  loadGameFAQs: function()
  {
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow('navigator:browser');
    if (GFlib.onGF(win.content.document))
      win.loadURI(win.content.document.location.href);
    else
      win.loadURI('http://www.gamefaqs.com/boards/');
  }
};
