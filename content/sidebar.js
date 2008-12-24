/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008
 * Abdullah A, Toad King, Andrianto Effendy, Brian Marshall, Michael Ryan
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
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService)
           .getBranch('gamefox.sidebar.'),

  onload: function()
  {
    // hide user disabled sections
    if (!GFsidebar.prefs.getBoolPref('gamefaqsnav'))
      document.getElementById('links').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('userlinks'))
      document.getElementById('userlinks').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('favorites'))
      document.getElementById('favorites').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('search'))
      document.getElementById('search').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('gotoboard'))
      document.getElementById('gotoboard').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('login'))
      document.getElementById('login').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('accounts'))
      document.getElementById('accounts').style.display = 'none';
    if (!GFsidebar.prefs.getBoolPref('tags'))
      document.getElementById('tags').style.display = 'none';

    // link middle clicking
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++)
      links[i].setAttribute('onmousedown', 'if (event.button == 1) ' +
          'GFlib.newTab(this.href, 1)');

    // listeners
    document.getElementById('gamefaqs-login-form').addEventListener(
        'submit', GFsidebar.redirectLogin, false);
    document.getElementById('gamefaqs-login-submit').addEventListener(
        'mousedown', GFsidebar.newTabLogin, false);
    document.getElementById('accounts-add-link').addEventListener(
        'click', GFsidebar.promptAccountsLogin, false);
    document.getElementById('accounts-rm-link').addEventListener(
        'click', GFsidebar.promptAccountsRemove, false);
    document.getElementById('favorites-menu').addEventListener(
        'mousedown', GFfavorites.selectFavorite, false);

    // accounts
    GFsidebar.populateAccounts();
    GFsidebarAccountsObserver.register();

    // favorites
    GFfavorites.populateFavorites(document,
        document.getElementById('favorites-menu'));
    GFsidebarFavoritesObserver.register();
  },

  populateAccounts: function()
  {
    var accountList, username, item, firstAccount;
    var currentAccount = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefBranch).getCharPref('gamefox.accounts.current');

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
      item.setAttribute('onclick', 'GFaccounts.switchAccount("' + username + '");return false');
      item.appendChild(document.createTextNode(username +
            (username == currentAccount ? '*' : '')));
      accountList.appendChild(item);
      item = document.createElement('br');
      accountList.appendChild(item);
    }
  },

  newTabLogin: function(event)
  {
    if (event.button != 1)
      return false;

    var form = event.target.parentNode;
    GFsidebar.redirectLogin(event);

    var browserWindow = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).
      getMostRecentWindow('navigator:browser');
    browserWindow.BrowserOpenTab();

    var oldSubmitEvent = form.getAttribute('onsubmit');
    form.removeAttribute('onsubmit');
    form.submit();
    form.setAttribute('onsubmit', oldSubmitEvent);
  },

  redirectLogin: function(event)
  {
    var sidebarDoc = GFlib.getDocument(event);

    var doc = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).getMostRecentWindow(
          'navigator:browser').content.document;
    var path = sidebarDoc.getElementById('gamefaqs-login-path');

    if (GFlib.onGF(doc))
      path.value = doc.location.href.replace(
          /&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/, '');
    else
      path.value = GFlib.domain + GFlib.path + 'index.php';
  },

  promptAccountsLogin: function(event)
  {
    event.preventDefault();
    GFaccounts.promptLogin();
  },

  promptAccountsRemove: function(event)
  {
    event.preventDefault();
    GFaccounts.promptRemoveAccount();
  }
};

window.addEventListener('load', GFsidebar.onload, false);
