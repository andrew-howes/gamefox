/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008
 * Abdullah A, Andrianto Effendy, Brian Marshall, Michael Ryan
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

var GFsidebar =
{
  onload: function()
  {
    // link middle clicking
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++)
      links[i].setAttribute('onmousedown', 'if (event.button == 1) ' +
          'GFlib.newTab(this.href, 1)');

    // accounts
    this.populateAccounts();
    GFsidebarAccountsObserver.register();
  },

  populateAccounts: function()
  {
    var accountList, username, item, firstAccount;

    accountList = document.getElementById('accounts-menu');
    if (!accountList)
      return;

    while (accountList.hasChildNodes())
      accountList.removeChild(accountList.firstChild);

    GFaccounts.read();

    document.getElementById('accounts-remove').style.display = 'none';
    firstAccount = true;
    for (username in GFaccounts.accounts)
    {
      if (firstAccount)
      {
        document.getElementById('accounts-remove').style.display = 'inline';
        firstAccount = false;
      }
      item = document.createElement('a');
      item.style.cursor = 'pointer';
      item.setAttribute('onclick', 'GFaccounts.switchAccount("' + username + '");return false');
      item.appendChild(document.createTextNode(username));
      accountList.appendChild(item);
      item = document.createElement('br');
      accountList.appendChild(item);
    }
  },

  newTabLogin: function(form)
  {
    this.redirectLogin(form);

    var browserWindow = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).
      getMostRecentWindow('navigator:browser');
    browserWindow.BrowserOpenTab();

    var oldSubmitEvent = form.getAttribute('onsubmit');
    form.removeAttribute('onsubmit');
    form.submit();
    form.setAttribute('onsubmit', oldSubmitEvent);
  },

  redirectLogin: function(form)
  {
    var doc = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).getMostRecentWindow(
          'navigator:browser').content.document;
    var path = form.ownerDocument.getElementById('gamefaqs-login-path');

    if (GFlib.onGF(doc))
      path.value = doc.location.href.replace(
          /&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/, '');
    else
      path.value = GFlib.domain + GFlib.path + 'index.php';
  }
};
