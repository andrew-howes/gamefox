/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan
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

var gamefox_context =
{
  displayMenu: function(event)
  {
    var target = gContextMenu.target;
    var doc = target.ownerDocument;
    var strbundle = document.getElementById('context-strings');

    document.getElementById('gamefox-toggle-sidebar').hidden = !gamefox_lib.prefs.
      getBoolPref('context.sidebar');
    document.getElementById('gamefox-tags').hidden = !gamefox_lib.prefs.
      getBoolPref('context.taglist');
    document.getElementById('gamefox-tracked').hidden = !gamefox_lib.prefs.
      getBoolPref('context.tracked');
    document.getElementById('gamefox-accounts').hidden = !gamefox_lib.prefs.
      getBoolPref('context.accounts');
    document.getElementById('gamefox-favorites').hidden = !gamefox_lib.prefs.
      getBoolPref('context.favorites');
    document.getElementById('gamefox-links').hidden = !gamefox_lib.prefs.
      getBoolPref('context.links');

    // Submenu
    var items = document.getElementById('gamefox-context-popup').childNodes;
    var hideMenu = true;
    for (var i = 0; i < items.length; i++)
    {
      if (!items[i].hidden)
      {
        hideMenu = false;
        break;
      }
    }
    document.getElementById('gamefox-context-menu').hidden = hideMenu;

    if (!gamefox_lib.onBoards(doc))
    {
      document.getElementById('gamefox-context-quote').hidden = true;
      document.getElementById('gamefox-context-tag').hidden = true;
      document.getElementById('gamefox-context-track').hidden = true;
      document.getElementById('gamefox-context-pages').hidden = true;
      document.getElementById('gamefox-context-usergroups').hidden = true;
      document.getElementById('gamefox-context-filter').hidden = true;
      document.getElementById('gamefox-context-delete').hidden = true;
      document.getElementById('gamefox-context-break-tags').hidden = true;
      return;
    }

    var hideQuote = true;
    var hideTag = true;
    var hideTrack = true;
    var hidePages = true;
    var hideUsergroups = true;
    var hideFilter = true;
    var hideDelete = true;
    var hideBreakTags = true;

    if (gamefox_lib.onPage(doc, 'topics') || gamefox_lib.onPage(doc, 'myposts'))
    {
      // Tag topic, track topic, pages and user groups
      try
      {
        var node = target;

        while (node.nodeName.toLowerCase() != 'td')
          node = node.parentNode;

        if (node.parentNode.cells.length > 1)
        {
          hideTag = false;

          if (node.parentNode.cells[0].innerHTML.indexOf('archived') == -1)
          {
            hideTrack = false;
            var topic = gamefox_utils.parseQueryString(node.parentNode.cells[1].
                getElementsByTagName('a')[0].href);
            if (gamefox_tracked.isTracked(topic['board'], topic['topic']))
              document.getElementById('gamefox-context-track')
                .label = strbundle.getString('stopTrack');
            else
              document.getElementById('gamefox-context-track')
                .label = strbundle.getString('trackTopic');
          }

          hidePages = false;

          if (gamefox_lib.onPage(doc, 'topics') && !gamefox_lib.onPage(doc, 'tracked'))
            hideUsergroups = false;
        }
      }
      catch (e) {}

      // Break tags
      if (target.nodeName == 'TEXTAREA'
          && target.selectionStart != target.selectionEnd)
        hideBreakTags = false;
    }
    else if (gamefox_lib.onPage(doc, 'messages'))
    {
      var userNav = doc.evaluate('div[@class="board_nav"]/div[@class="body"]'
          + '/div[@class="user"]', doc.getElementById('board_wrap'), null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      userNav = userNav ? userNav.textContent : '';

      // Tag topic
      hideTag = false;

      // Track topic
      if (userNav.indexOf('Track Topic') != -1
          || userNav.indexOf('Stop Tracking') != -1)
      {
        hideTrack = false;
        var topic = gamefox_utils.parseQueryString(doc.location.search);
        if (gamefox_tracked.isTracked(topic['board'], topic['topic']))
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('stopTrack');
        else
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('trackTopic');
      }

      // Quoting, user groups, filtering and delete
      var msgComponents = gamefox_utils.getMsgComponents(target, doc);
      if (msgComponents)
      {
        var deleteType = msgComponents.header.getAttribute('gfdeletetype');

        if (doc.getElementById('gamefox-message'))
          hideQuote = false;

        hideUsergroups = false;

        hideFilter = false;
        if (!doc.gamefox.filtered)
          document.getElementById('gamefox-context-filter')
            .label = strbundle.getString('filter');
        else
          document.getElementById('gamefox-context-filter')
            .label = strbundle.getString('unfilter');

        if (deleteType == 'deletetopic')
        {
          hideDelete = false;
          document.getElementById('gamefox-context-delete')
            .label = strbundle.getString('deleteTopic');
        }
        else if (deleteType == 'deletepost')
        {
          hideDelete = false;
          document.getElementById('gamefox-context-delete')
            .label = strbundle.getString('deletePost');
        }
        else if (deleteType == 'close')
        {
          hideDelete = false;
          document.getElementById('gamefox-context-delete')
            .label = strbundle.getString('closeTopic');
        }
      }

      // Break tags
      if (target.nodeName == 'TEXTAREA'
          && target.selectionStart != target.selectionEnd)
        hideBreakTags = false;
    }
    else if (gamefox_lib.onPage(doc, 'post'))
    {
      // Break tags
      if (target.nodeName == 'TEXTAREA'
          && target.selectionStart != target.selectionEnd)
        hideBreakTags = false;
    }

    document.getElementById('gamefox-context-quote').hidden = hideQuote
      || !gamefox_lib.prefs.getBoolPref('context.quote');
    document.getElementById('gamefox-context-tag').hidden = hideTag
      || !gamefox_lib.prefs.getBoolPref('context.tag');
    document.getElementById('gamefox-context-track').hidden = hideTrack
      || !gamefox_lib.prefs.getBoolPref('context.track');
    document.getElementById('gamefox-context-pages').hidden = hidePages
      || !gamefox_lib.prefs.getBoolPref('context.pagelist');
    document.getElementById('gamefox-context-usergroups').hidden = hideUsergroups
      || !gamefox_lib.prefs.getBoolPref('context.usergroups');
    document.getElementById('gamefox-context-filter').hidden = hideFilter
      || !gamefox_lib.prefs.getBoolPref('context.filter');
    document.getElementById('gamefox-context-delete').hidden = hideDelete
      || !gamefox_lib.prefs.getBoolPref('context.delete');
    document.getElementById('gamefox-context-break-tags').hidden = hideBreakTags
      || !gamefox_lib.prefs.getBoolPref('context.breaktags');
  },

  populateTracked: function()
  {
    var item, topic;
    var menu = document.getElementById('gamefox-tracked-menu');
    var strbundle = document.getElementById('context-strings');

    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('updateTracked'));
    item.setAttribute('oncommand', 'gamefox_tracked.updateList()');
    menu.appendChild(item);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('detach'));
    item.setAttribute('oncommand', 'gamefox_tracked.openWindow()');
    menu.appendChild(item);

    gamefox_tracked.read();
    var firstTopic = true;
    for (var i in gamefox_tracked.list)
    {
      for (var j in gamefox_tracked.list[i].topics)
      {
        if (firstTopic)
        {
          menu.appendChild(document.createElement('menuseparator'));
          firstTopic = false;
        }

        topic = gamefox_tracked.list[i].topics[j];

        item = document.createElement('menuitem');
        item.setAttribute('label', topic['title']);
        item.setAttribute('oncommand',
            'gamefox_lib.open("' + i + ',' + j + '", 2)');
        item.setAttribute('onclick',
            'if (event.button == 1) gamefox_lib.open("' + i + ',' + j + '", 0)');
        menu.appendChild(item);
      }
    }
  },

  populateAccounts: function()
  {
    var menu, username, item, firstAccount;
    var currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');

    menu = document.getElementById('gamefox-accounts-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    gamefox_accounts.read();

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Add account...');
    item.setAttribute('oncommand', 'gamefox_accounts.promptLogin()');
    menu.appendChild(item);

    firstAccount = true;
    for (username in gamefox_accounts.accounts)
    {
      if (firstAccount)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Remove account...');
        item.setAttribute('oncommand', 'gamefox_accounts.promptRemoveAccount()');
        menu.appendChild(item);
        menu.appendChild(document.createElement('menuseparator'));
        firstAccount = false;
      }
      item = document.createElement('menuitem');
      item.setAttribute('label', username +
          (username.toLowerCase() == currentAccount.toLowerCase() ?
           '*' : ''));
      item.setAttribute('oncommand', 'gamefox_accounts.switchAccount("' + username + '")');
      menu.appendChild(item);
    }
  },

  populateFavorites: function()
  {
    var menu, favs, item, i;

    menu = document.getElementById('gamefox-favorites-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    favs = gamefox_lib.safeEval(gamefox_utils.getString('favorites.serialized'));

    for (i = 0; i < favs.length; i++)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', favs[i].name);
      item.setAttribute('oncommand', 'gamefox_lib.open("' + favs[i].id + '", 2)');
      item.setAttribute('onclick', 'if (event.button == 1) gamefox_lib.open("' + favs[i].id + '", 0)');
      menu.appendChild(item);
    }
  },

  populateLinks: function()
  {
    var menu, links, item, i, baseUri;

    menu = document.getElementById('gamefox-links-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    baseUri = gamefox_lib.domain + gamefox_lib.path;
    links = [
      'myposts.php', 'Active Messages', 'A',
      'index.php', 'Boards', 'B',
      'tracked.php', 'Tracked Topics', 'T',
      'user.php', 'User Profile', 'U'
    ];

    for (i = 0; i < links.length; i += 3)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', links[i+1]);
      item.setAttribute('accesskey', links[i+2]);
      item.setAttribute('oncommand', 'gamefox_lib.openPage("' + baseUri + links[i] + '", 2)');
      item.setAttribute('onclick',
          'if (event.button == 1) gamefox_lib.openPage("' + baseUri + links[i] + '", 1)');
      menu.appendChild(item);
    }
  }
};
