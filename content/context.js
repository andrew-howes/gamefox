/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012 Brian Marshall, Michael Ryan
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
    var strbundle = document.getElementById('gamefox-context-strings');
    var target = gContextMenu.target;
    // gContextMenu.target is undefined when right clicking on a submit input
    // (maybe other elements too), so falling back to the XUL document here at
    // least ensures that the context menu is clean instead of throwing an
    // exception
    var doc = target ? target.ownerDocument : document;

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
      document.getElementById('gamefox-context-edit').hidden = true;
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
    var hideEdit = true;
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
            var ids = gamefox_utils.parseBoardLink(node.parentNode.cells[1].
                getElementsByTagName('a')[0].href);
            if (gamefox_tracked.isTracked(ids['topic']))
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
      var onDetail = gamefox_lib.onPage(doc, 'detail');

      var userNav = doc.evaluate('.//div[@class="board_nav"]'
          + '/div[@class="body"]/div[@class="user"]',
          doc.getElementById('content'), null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      userNav = userNav ? userNav.textContent : '';

      // Topic pages
      hidePages = false;

      // Tag topic
      hideTag = false;

      // Track topic
      if (userNav.indexOf('Track Topic') != -1
          || userNav.indexOf('Stop Tracking') != -1)
      {
        hideTrack = false;
        var ids = gamefox_utils.parseBoardLink(doc.location.href);
        if (gamefox_tracked.isTracked(ids['topic']))
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('stopTrack');
        else
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('trackTopic');
      }

      // Quote, user groups, filter, delete, edit
      var msgComponents = gamefox_utils.getMsgComponents(target, doc);
      var msgHeader = msgComponents.header;
      if (msgComponents)
      {
        var deleteType = msgHeader.getUserData('gamefox_deleteType');
        var canEdit = msgHeader.getUserData('gamefox_editURI');

        if (doc.getElementById('gamefox-message'))
          hideQuote = false;

        hideUsergroups = false;

        if (onDetail)
          hideFiler = true;
        else
        {
          hideFilter = false;
          if (!doc.gamefox.filtered)
            document.getElementById('gamefox-context-filter')
              .label = strbundle.getString('filter');
          else
            document.getElementById('gamefox-context-filter')
              .label = strbundle.getString('unfilter');
        }

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

        if (canEdit)
          hideEdit = false;
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
    document.getElementById('gamefox-context-edit').hidden = hideEdit
      || !gamefox_lib.prefs.getBoolPref('context.edit');
    document.getElementById('gamefox-context-break-tags').hidden = hideBreakTags
      || !gamefox_lib.prefs.getBoolPref('context.breaktags');
  },

  populateTags: function()
  {
    var menu, board, topic, item;

    menu = document.getElementById('gamefox-tags-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    gamefox_tags.read();
    for (board in gamefox_tags.tags)
    {
      for (topic in gamefox_tags.tags[board].topics)
      {
        item = document.createElement('menuitem');
        item.setUserData('data', board + ',' + topic, null);
        item.setAttribute('label', gamefox_tags.tags[board].topics[topic]);
        item.addEventListener('command', function() {
          gamefox_lib.open(this.getUserData('data'), 2);
        }, false);
        item.addEventListener('click', function(event) {
          if (event.button == 1)
            gamefox_lib.open(this.getUserData('data'), 0);
        }, false);
        menu.appendChild(item);
      }
    }
  },

  populateTracked: function()
  {
    var strbundle, menu, item, first, board, topic, topicObj;

    strbundle = document.getElementById('gamefox-context-strings');
    menu = document.getElementById('gamefox-tracked-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('updateTracked'));
    item.addEventListener('command', function() {
      gamefox_tracked.updateList();
    }, false);
    menu.appendChild(item);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('detach'));
    item.addEventListener('command', function() {
      gamefox_tracked.openWindow();
    }, false);
    menu.appendChild(item);

    gamefox_tracked.read();
    first = true;
    for (topicId in gamefox_tracked.list)
    {
      if (first)
      {
        menu.appendChild(document.createElement('menuseparator'));
        first = false;
      }

      topicObj = gamefox_tracked.list[topicId];

      item = document.createElement('menuitem');
      item.setUserData('data', gamefox_lib.domain + topicObj.link, null);
      item.setAttribute('label', topicObj.title);
      item.addEventListener('command', function() {
        gamefox_lib.openPage(this.getUserData('data'), 2);
      }, false);
      item.addEventListener('click', function(event) {
        if (event.button == 1)
          gamefox_lib.openPage(this.getUserData('data'), 0);
      }, false);
      menu.appendChild(item);
    }
  },

  populateAccounts: function()
  {
    var strbundle, menu, item, currentAccount, first, username;

    strbundle = document.getElementById('gamefox-context-strings');
    menu = document.getElementById('gamefox-accounts-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('addAccount'));
    item.addEventListener('command', function() {
      gamefox_accounts.promptLogin();
    }, false);
    menu.appendChild(item);

    currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');
    gamefox_accounts.read();
    first = true;
    for (username in gamefox_accounts.accounts)
    {
      if (first)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', strbundle.getString('removeAccount'));
        item.addEventListener('command', function() {
          gamefox_accounts.promptRemoveAccount();
        }, false);
        menu.appendChild(item);
        menu.appendChild(document.createElement('menuseparator'));
        first = false;
      }
      item = document.createElement('menuitem');
      item.setUserData('username', username, null);
      item.setAttribute('label', username +
          (username.toLowerCase() == currentAccount.toLowerCase() ?
           '*' : ''));
      item.addEventListener('command', function() {
        gamefox_accounts.switchAccount(this.getUserData('username'));
      }, false);
      menu.appendChild(item);
    }
  },

  populateFavorites: function()
  {
    var menu, favs, i, item;

    menu = document.getElementById('gamefox-favorites-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    favs = gamefox_lib.safeEval(gamefox_lib.getString('favorites.serialized'));
    for (i in favs)
    {
      item = document.createElement('menuitem');
      item.setUserData('data', i, null);
      item.setAttribute('label', favs[i].name);
      item.addEventListener('command', function() {
        gamefox_lib.open(this.getUserData('data'), 2);
      }, false);
      item.addEventListener('click', function(event) {
        if (event.button == 1)
          gamefox_lib.open(this.getUserData('data'), 0);
      }, false);
      menu.appendChild(item);
    }
  },

  populateLinks: function()
  {
    var menu, baseUri, links, item, i;

    menu = document.getElementById('gamefox-links-menu');
    if (menu.hasChildNodes())
      return;

    baseUri = gamefox_lib.domain + gamefox_lib.path;
    links = [
      'myposts.php', 'Active Messages', 'A',
      'index.php', 'Boards', 'B',
      'friends', 'Friends', 'F',
      'tracked.php', 'Tracked Topics', 'T',
      'user.php', 'User Profile', 'U'
    ];

    for (i = 0; i < links.length; i += 3)
    {
      item = document.createElement('menuitem');
      item.setUserData('link', baseUri + links[i], null);
      item.setAttribute('label', links[i+1]);
      item.setAttribute('accesskey', links[i+2]);
      item.addEventListener('command', function() {
        gamefox_lib.openPage(this.getUserData('link'), 2);
      }, false);
      item.addEventListener('click', function(event) {
        if (event.button == 1)
          gamefox_lib.openPage(this.getUserData('link'), 1);
      }, false);
      menu.appendChild(item);
    }
  },

  populatePages: function(event)
  {
    var menu, node, doc, topiclink, posts, tc, board, topic, pages, tcParam,
      i, item, thisPage;

    menu = document.getElementById('gamefox-pages-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    node = event.target;
    doc = node.ownerDocument;

    if (gamefox_lib.onPage(doc, 'topics') || gamefox_lib.onPage(doc, 'myposts'))
    {
      try
      {
        while (node.nodeName.toLowerCase() != 'td')
          node = node.parentNode;
        node = node.parentNode; // topic row

        topiclink = node.cells[1].getElementsByTagName('a')[0].href;
        posts = node.cells[gamefox_lib.onPage(doc, 'myposts') ? 2 : 3].textContent;
        pages = Math.ceil(posts / gamefox_lib.prefs.getIntPref('msgsPerPage'));
        tc = gamefox_lib.onPage(doc, 'tracked') || gamefox_lib.onPage(doc, 'myposts')
          ? '' : node.cells[2].firstChild.textContent.trim();
        thisPage = -1;
      }
      catch (e)
      {
        return;
      }
    }
    else
    { // on message list
      topiclink = doc.location.href;
      pages = doc.gamefox.pages;
      tc = doc.gamefox.tc;
      thisPage = doc.gamefox.thisPage;
    }

    var params = gamefox_utils.parseBoardLink(topiclink);
    var board = params['board'], topic = params['topic'];
    for (i = 0; i < pages; i++)
    {
      item = document.createElement('menuitem');
      item.setUserData('data', gamefox_utils.newURI(board, topic, i, tc, null,
            topiclink), null);
      item.setAttribute('label', (i + 1) + (i == thisPage ? '*' : ''));
      item.addEventListener('command', function() {
        gamefox_lib.openPage(this.getUserData('data'), 2);
      }, false);
      item.addEventListener('click', function(event) {
        if (event.button == 1)
          gamefox_lib.openPage(this.getUserData('data'), 0);
      }, false);
      menu.appendChild(item);
    }
  },

  populateUserGroups: function(event)
  {
    var strbundle, menu, node, doc, username, activeGroups, userlist, noGroups,
      i, item, label, info;

    strbundle = document.getElementById('gamefox-context-strings');
    menu = document.getElementById('gamefox-context-usergroups-list');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    node = event.target;
    while (node.nodeName != 'TD')
      node = node.parentNode;

    // get the username of the target
    doc = event.target.ownerDocument;
    if (gamefox_lib.onPage(doc, 'topics')) // topic list
    {
      node = node.parentNode.cells[2].firstChild;
    }
    else // message list
    {
      node = gamefox_utils.getMsgComponents(node, doc);
      if (!node) return;

      node = node.header.querySelector(gamefox_lib.onPage(doc, 'archive') ? 'b'
          : 'a.name');
    }
    username = gamefox_utils.cleanUsername(node.textContent);

    userlist = gamefox_highlighting.loadGroups();
    activeGroups = gamefox_highlighting
      .searchUsername(username, false, null, userlist)[4];
    if (!activeGroups) activeGroups = [];

    noGroups = true;
    for (i = 0; i < userlist.length; i++)
    {
      if (userlist[i].type != 'users') continue;
      noGroups = false;

      item = document.createElement('menuitem');
      item.setAttribute('type', 'checkbox');
      item.setUserData('username', username, null);
      item.setUserData('group', i, null);
      item.addEventListener('command', function(event) {
        gamefox_highlighting.menuCheckChange(event,
          this.getUserData('username'), this.getUserData('group'));
      }, false);
      if (activeGroups.indexOf(i) != -1)
        item.setAttribute('checked', 'true');

      // label
      // TODO: localize userlist[i].messages and userlist[i].topics
      label = userlist[i].name.length ? userlist[i].name : strbundle.getFormattedString('groupNum', [i + 1]);
      info = '';
      if (userlist[i].messages == userlist[i].topics)
      {
        if (userlist[i].messages != 'nothing')
          info = userlist[i].messages + ' ' + strbundle.getString('messages') + '/' + strbundle.getString('topics');
      }
      else
      {
        if (userlist[i].messages != 'nothing')
          info = userlist[i].messages + ' ' + strbundle.getString('messages');
        if (userlist[i].topics != 'nothing')
        {
          if (info.length)
            info += ', ';
          info += userlist[i].topics + ' ' + strbundle.getString('topics');
        }
      }
      if (info.length)
        label += ' (' + info + ')';
      item.setAttribute('label', label);

      menu.appendChild(item);
    }

    if (noGroups)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', strbundle.getString('noGroups'));
      item.setAttribute('disabled', 'true');
      menu.appendChild(item);
    }

    menu.appendChild(document.createElement('menuseparator'));
    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('editGroups'));
    item.addEventListener('command', function() {
      gamefox_lib.openOptionsDialog(null, null, null, 'paneHighlighting');
    }, false);
    menu.appendChild(item);
  }
};
