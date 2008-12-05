/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan
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

    document.getElementById('gamefox-toggle-sidebar').hidden = !GameFOX.prefs.
      getBoolPref('context.sidebar');
    document.getElementById('gamefox-tags').hidden = !GameFOX.prefs.
      getBoolPref('context.taglist');
    document.getElementById('gamefox-accounts').hidden = !GameFOX.prefs.
      getBoolPref('context.accounts');
    document.getElementById('gamefox-favorites').hidden = !GameFOX.prefs.
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
      document.getElementById('gamefox-context-pages').hidden = true;
      document.getElementById('gamefox-context-usergroups').hidden = true;
      document.getElementById('gamefox-context-filter').hidden = true;
      document.getElementById('gamefox-context-delete').hidden = true;
      return;
    }

    var hideQuote = true;
    var hideTag = true;
    var hidePages = true;
    var hideUsergroups = true;
    var hideFilter = true;
    var hideDelete = true;

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
          hideTag = false;
          hidePages = false;
          if (GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'tracked'))
            hideUsergroups = false;
        }
      }
      catch (e) {}
    }
    else if (GFlib.onPage(doc, 'messages'))
    {
      // Tag topic
      if (doc.getElementsByTagName('h1').length > 1)
        hideTag = false;

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

        if (deleteType == 'delete' && msgComponents.header.id == 'p001')
        {
          hideDelete = false;
          document.getElementById('gamefox-context-delete')
            .label = strbundle.getString('deleteTopic');
        }
        else if (deleteType == 'delete')
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
    }

    document.getElementById('gamefox-context-quote').hidden = hideQuote
      || !GameFOX.prefs.getBoolPref('context.quote');
    document.getElementById('gamefox-context-tag').hidden = hideTag
      || !GameFOX.prefs.getBoolPref('context.tag');
    document.getElementById('gamefox-context-pages').hidden = hidePages
      || !GameFOX.prefs.getBoolPref('context.pagelist');
    document.getElementById('gamefox-context-usergroups').hidden = hideUsergroups
      || !GameFOX.prefs.getBoolPref('context.usergroups');
    document.getElementById('gamefox-context-filter').hidden = hideFilter
      || !GameFOX.prefs.getBoolPref('context.filter');
    document.getElementById('gamefox-context-delete').hidden = hideDelete
      || !GameFOX.prefs.getBoolPref('context.delete');
  }
};
