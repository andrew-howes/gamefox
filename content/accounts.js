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
    var accountList, account, item;

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
    item.setAttribute('oncommand', 'GameFOXAccounts.switchAccount(null, null, 0)');
    accountList.appendChild(item);
    accountList.appendChild(document.createElement('menuseparator'));

    for (account in this.accounts)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', account);
      item.setAttribute('oncommand', 'GameFOXAccounts.switchAccount("' + account + '", "' + this.accounts[account].MDAAuth.content + '", "' + this.accounts[account].MDAAuth.expires + '")');
      accountList.appendChild(item);
    }
  },

  switchAccount: function(account, content, expires)
  {
    this.removeCookie('MDAAuth');

    expires *= 1000;
    var d = new Date();
    if (d.getTime() < expires)
    {
      expires = new Date(Number(expires));
      var uri = Components.classes['@mozilla.org/network/io-service;1']
          .getService(Components.interfaces.nsIIOService)
          .newURI('http://www.gamefaqs.com', null, null);
      Components.classes['@mozilla.org/cookieService;1']
          .getService(Components.interfaces.nsICookieService)
          .setCookieString(uri, null, 'MDAAuth=' + content + '; expires=' + expires.toUTCString(), null);
      Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').loadURI('http://www.gamefaqs.com/boards/');
    }
    else
    {
      this.loginAndSaveCookie(account);
    }
  },

  removeCookie: function(name)
  {
    var cookieMgr = Components.classes['@mozilla.org/cookiemanager;1']
        .getService(Components.interfaces.nsICookieManager);
    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
      if (/(^|\.)gamefaqs\.com/.test(cookie.host) && cookie.name == name)
        cookieMgr.remove(cookie.host, name, cookie.path, false);
    }
  },

  getCookie: function(name)
  {
    var cookieMgr = Components.classes['@mozilla.org/cookiemanager;1']
        .getService(Components.interfaces.nsICookieManager);
    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
      if (/(^|\.)gamefaqs\.com/.test(cookie.host) && cookie.name == name)
        return {content: cookie.value, expires: cookie.expires};
    }
    return null;
  },

  loginAndSaveCookie: function(username)
  {
    var password = {value: ''};
    var check = {value: true};
    var result;
    if (username == null)
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

    var request = new XMLHttpRequest();
    request.open('POST', 'http://www.gamefaqs.com/user/login.html');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (/There was an error while logging you in/.test(request.responseText)) {
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
        if (username in GameFOXAccounts.accounts)
        {
          GameFOXAccounts.accounts[username].MDAAuth.content = cookie.content;
          GameFOXAccounts.accounts[username].MDAAuth.expires = cookie.expires;
        }
        else
        {
          GameFOXAccounts.accounts[username] = {MDAAuth:{content:cookie.content, expires:cookie.expires}};
        }
        GameFOXAccounts.write(GameFOXAccounts.accounts);

        Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').loadURI('http://www.gamefaqs.com/boards/');
      }
    }
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.send(
        'EMAILADDR=' + GameFOXUtils.URLEncode(username) +
        '&PASSWORD=' + GameFOXUtils.URLEncode(password.value)
        );
  }
};
