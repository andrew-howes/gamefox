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
    var doc = gContextMenu.target.ownerDocument;
    var strbundle = document.getElementById('context-strings');

    document.getElementById('gamefox-toggle-sidebar').hidden = !GFlib.prefs.
      getBoolPref('context.sidebar');
    document.getElementById('gamefox-tags').hidden = !GFlib.prefs.
      getBoolPref('context.taglist');
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
      // Tag topic, pages and user groups
      try
      {
        var node = gContextMenu.target;

        while (node.nodeName.toLowerCase() != 'td')
        {
          node = node.parentNode;
        }

        if (node.parentNode.cells.length > 1)
        {
          var topic = GFutils.parseQueryString(node.parentNode.cells[1].
              getElementsByTagName('a')[0].href);

          hideTag = false;

          hideTrack = false;
          if (!GFtracked.isTracked(topic['board'], topic['topic']))
            document.getElementById('gamefox-context-track')
              .label = strbundle.getString('trackTopic');
          else
            document.getElementById('gamefox-context-track')
              .label = strbundle.getString('stopTrack');

          hidePages = false;
          if (GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'tracked'))
            hideUsergroups = false;
        }
      }
      catch (e) {}
    }
    else if (GFlib.onPage(doc, 'messages'))
    {
      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      // Tag and track topic
      if (doc.getElementsByTagName('h1').length > 1)
      {
        hideTag = false;
        
        hideTrack = false;
        var trackLink = doc.evaluate('./a[contains(@href, "track")]', userNav,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (trackLink.href.indexOf('tracktopic') != -1)
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('trackTopic');
        else
          document.getElementById('gamefox-context-track')
            .label = strbundle.getString('stopTrack');
      }

      // Quoting, filtering and user groups
      var msgComponents = GFutils.getMsgComponents(gContextMenu.target, doc);
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
      if (gContextMenu.target.nodeName == 'TEXTAREA'
          && gContextMenu.target.selectionStart != gContextMenu.target.selectionEnd)
        hideBreakTags = false;
    }
    else if (GFlib.onPage(doc, 'post'))
    {
      if (gContextMenu.target.nodeName == 'TEXTAREA'
          && gContextMenu.target.selectionStart != gContextMenu.target.selectionEnd)
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
  }
};
