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

var GFcontext =
{
  displayMenu: function(event)
  {
    var target = gContextMenu.target;
    var doc = target.ownerDocument;
    var strbundle = document.getElementById('strings');

    document.getElementById('gamefox-toggle-sidebar').hidden = !GFlib.prefs.
      getBoolPref('context.sidebar');
    document.getElementById('gamefox-tags').hidden = !GFlib.prefs.
      getBoolPref('context.taglist');
    document.getElementById('gamefox-tracked').hidden = !GFlib.prefs.
      getBoolPref('context.tracked');
    document.getElementById('gamefox-accounts').hidden = !GFlib.prefs.
      getBoolPref('context.accounts');
    document.getElementById('gamefox-favorites').hidden = !GFlib.prefs.
      getBoolPref('context.favorites');

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

    if (!GFlib.onBoards(doc))
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

    if (GFlib.onPage(doc, 'topics') || GFlib.onPage(doc, 'myposts'))
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
            var topic = GFutils.parseQueryString(node.parentNode.cells[1].
                getElementsByTagName('a')[0].href);
            if (GFtracked.isTracked(topic['board'], topic['topic']))
              document.getElementById('gamefox-context-track')
                .label = strbundle.getString('stopTrack');
            else
              document.getElementById('gamefox-context-track')
                .label = strbundle.getString('trackTopic');
          }

          hidePages = false;

          if (GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'tracked'))
            hideUsergroups = false;
        }
      }
      catch (e) {}

      // Break tags
      if (target.nodeName == 'TEXTAREA'
          && target.selectionStart != target.selectionEnd)
        hideBreakTags = false;
    }
    else if (GFlib.onPage(doc, 'messages'))
    {
      var userNav = doc.evaluate('div[@class="board_nav"]/div[@class="body"]'
          + '/div[@class="user"]', doc.getElementById('board_wrap'), null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      userNav = userNav ? userNav.textContent : '';

      // Tag topic
      if (doc.getElementsByTagName('h1').length > 1)
        hideTag = false;

      // Track topic
      if (userNav.indexOf('Track Topic') != -1
          || userNav.indexOf('Stop Tracking') != -1)
      {
        hideTrack = false;
        var topic = GFutils.parseQueryString(doc.location.search);
        if (GFtracked.isTracked(topic['board'], topic['topic']))
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('stopTrack');
        else
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('trackTopic');
      }

      // Quoting, user groups, filtering and delete
      var msgComponents = GFutils.getMsgComponents(target, doc);
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
    else if (GFlib.onPage(doc, 'post'))
    {
      // Break tags
      if (target.nodeName == 'TEXTAREA'
          && target.selectionStart != target.selectionEnd)
        hideBreakTags = false;
    }

    document.getElementById('gamefox-context-quote').hidden = hideQuote
      || !GFlib.prefs.getBoolPref('context.quote');
    document.getElementById('gamefox-context-tag').hidden = hideTag
      || !GFlib.prefs.getBoolPref('context.tag');
    document.getElementById('gamefox-context-track').hidden = hideTrack
      || !GFlib.prefs.getBoolPref('context.track');
    document.getElementById('gamefox-context-pages').hidden = hidePages
      || !GFlib.prefs.getBoolPref('context.pagelist');
    document.getElementById('gamefox-context-usergroups').hidden = hideUsergroups
      || !GFlib.prefs.getBoolPref('context.usergroups');
    document.getElementById('gamefox-context-filter').hidden = hideFilter
      || !GFlib.prefs.getBoolPref('context.filter');
    document.getElementById('gamefox-context-delete').hidden = hideDelete
      || !GFlib.prefs.getBoolPref('context.delete');
    document.getElementById('gamefox-context-break-tags').hidden = hideBreakTags
      || !GFlib.prefs.getBoolPref('context.breaktags');
  },

  populateFavorites: function()
  {
    var menu, favs, item, i;

    menu = document.getElementById('gamefox-favorites-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    favs = eval(GFlib.prefs.getCharPref('favorites.serialized'));

    for (i = 0; i < favs.length; i++)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', favs[i].name);
      item.setAttribute('oncommand', 'GFlib.open("' + favs[i].id + '", 2)');
      item.setAttribute('onclick', 'if (event.button == 1) GFlib.open("' + favs[i].id + '", 0)');
      menu.appendChild(item);
    }
  },

  populateMisc: function()
  {
    var menu, links, item, i;

    menu = document.getElementById('gamefox-misc-menu');
    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    links = [
      GFlib.domain + GFlib.path + 'myposts.php', 'Active Messages', 'A',
      GFlib.domain + GFlib.path + 'index.php', 'Boards', 'B',
      GFlib.domain + GFlib.path + 'tracked.php', 'Tracked Topics', 'T',
      GFlib.domain + GFlib.path + 'user.php', 'User Profile', 'U'
    ];

    for (i = 0; i < links.length; i += 3)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', links[i+1]);
      item.setAttribute('accesskey', links[i+2]);
      item.setAttribute('oncommand', 'GFlib.openPage("' + links[i] + '", 2)');
      item.setAttribute('onclick', 'if (event.button == 1) GFlib.openPage("' + links[i] + '", 0)');
      menu.appendChild(item);
    }
  }
};
