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

var gamefox_sidebar =
{
  onload: function()
  {
    // hide user disabled sections
    gamefox_sidebar.updateSections();
    new gamefox_observer('sidebar', gamefox_sidebar.updateSections);

    // link middle clicking
    // disable dotted outline after loading link
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++)
    {
      links[i].setAttribute('onmousedown', 'if (event.button == 1) ' +
          'gamefox_lib.newTab(this.href, 1)');
      links[i].addEventListener('click', function() { this.blur(); }, false);
    }

    // listeners
    document.getElementById('gamefaqs-login-form').addEventListener(
        'submit', gamefox_sidebar.redirectLogin, false);
    document.getElementById('gamefaqs-login-submit').addEventListener(
        'mousedown', gamefox_sidebar.newTabLogin, false);
    document.getElementById('accounts-add-link').addEventListener(
        'click', gamefox_sidebar.promptAccountsLogin, false);
    document.getElementById('accounts-rm-link').addEventListener(
        'click', gamefox_sidebar.promptAccountsRemove, false);

    // accounts
    gamefox_sidebar.populateAccounts();
    new gamefox_observer('accounts', gamefox_sidebar.populateAccounts);
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
        prefs.getBoolPref(sections[i]) ? '' : 'none';
    }
  },

  populateAccounts: function()
  {
    var menu, item, currentAccount, first, username;

    menu = document.getElementById('accounts-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    document.getElementById('accounts-remove').style.display = 'none';

    currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');
    gamefox_accounts.read();
    first = true;
    for (username in gamefox_accounts.accounts)
    {
      if (first)
      {
        document.getElementById('accounts-remove').style.display = '';
        first = false;
      }
      item = document.createElement('a');
      item.setUserData('username', username, null);
      item.setAttribute('onclick', 'gamefox_accounts.switchAccount(this.getUserData("username"));return false');
      item.appendChild(document.createTextNode(username +
            (username.toLowerCase() == currentAccount.toLowerCase() ?
             '*' : '')));
      menu.appendChild(item);
      menu.appendChild(document.createElement('br'));
    }
  },

  newTabLogin: function(event)
  {
    if (event.button != 1)
      return;

    gamefox_sidebar.redirectLogin();

    Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser')
      .BrowserOpenTab();

    event.target.parentNode.submit();
  },

  redirectLogin: function()
  {
    var doc = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser').content.document;

    document.getElementById('gamefaqs-login-path').value =
      gamefox_lib.onGF(doc) ? doc.location.href.replace(
        /&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/, '') :
        gamefox_lib.domain + gamefox_lib.path + 'index.php';
  },

  promptAccountsLogin: function(event)
  {
    event.preventDefault();
    gamefox_accounts.promptLogin();
  },

  promptAccountsRemove: function(event)
  {
    event.preventDefault();
    gamefox_accounts.promptRemoveAccount();
  }
};

window.addEventListener('load', gamefox_sidebar.onload, false);
