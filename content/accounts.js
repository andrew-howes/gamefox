/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXAccounts =
{
  accounts: '',

  read: function()
  {
    this.accounts = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getCharPref('gamefox.accounts');

    if (this.accounts.replace(/\s/g, '') == '')
    {
      //this.accounts = '({})';
      this.accounts = '({"some guy":{MDAAuth:{content:"foo", expires:"bar"}}})';
    }

    this.accounts = eval(this.accounts);
  },

  write: function(accounts)
  {
    if (typeof(accounts) == 'object')
    {
      accounts = accounts.toSource();
    }

    Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).setCharPref('gamefox.accounts', accounts);
  },

  populate: function()
  {
    var accountList, account;

    accountList = document.getElementById('gamefox-accounts-menu');

    if (!accountList)
    {
      return;
    }

    while (accountList.hasChildNodes())
    {
      accountList.removeChild(accountList.childNodes[0]);
    }

    this.read();

    for (account in this.accounts)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', account);
      item.setAttribute('oncommand', 'GameFOXAccounts.switchAccount("' + this.accounts[account].MDAAuth.content + '", "' + this.accounts[account].MDAAuth.expires + '")');
      item.setAttribute('onclick', 'if (event.button == 1) GameFOXAccounts.switchAccount("' + this.accounts[account].MDAAuth.content + '", "' + this.accounts[account].MDAAuth.expires + '")');
      accountList.appendChild(item);
    }
  },

  switchAccount: function(cookie, expires)
  {
    alert(cookie);
    alert(expires);
  }
};
