/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008, 2009
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
  onload: function()
  {
    // hide user disabled sections
    GFsidebar.updateSections();
    new GFobserver('sidebar', GFsidebar.updateSections);

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
    new GFobserver('accounts', GFsidebar.populateAccounts);

    // favorites
    GFsidebar.updateFavorites();
    new GFobserver('favorites.serialized', GFsidebar.updateFavorites);
  },

  updateSections: function()
  {
    var prefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefService)
      .getBranch('gamefox.sidebar.');
    var sections = [
      'gamefaqsnav', 'links',
      'userlinks', 'userlinks',
      'favorites', 'favorites',
      'search', 'search',
      'gotoboard', 'gotoboard',
      'login', 'login',
      'accounts', 'accounts',
      'tags', 'tags',
      'tracked', 'tracked'
    ];
    for (var i = 0; i < sections.length; i += 2)
    {
      document.getElementById(sections[i+1]).style.display =
        prefs.getBoolPref(sections[i]) ? 'block' : 'none';
    }
  },

  updateFavorites: function()
  {
    GFfavorites.populateFavorites(document,
        document.getElementById('favorites-menu'));
  },

  populateAccounts: function()
  {
    var accountList, username, item, firstAccount;
    var currentAccount = GFlib.prefs.getCharPref('accounts.current');

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
            (username.toLowerCase() == currentAccount.toLowerCase() ?
             '*' : '')));
      accountList.appendChild(item);
      item = document.createElement('br');
      accountList.appendChild(item);
    }
  },

  newTabLogin: function(event)
  {
    if (event.button != 1)
      return;

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
