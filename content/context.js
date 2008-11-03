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
      return;
    }

    var hideQuote = true;
    var hideUsergroups = true;
    if (GFlib.onPage(doc, 'messages'))
    {
      // User groups
      try
      {
        var node = gContextMenu.target;
        if (node.nodeName.toLowerCase() == 'a'
            && node.href.indexOf('user.php') != -1
            && node.parentNode.id.indexOf('p') == 0)
          hideUsergroups = false;
      }
      catch (e) {}

      // Quote
      if (doc.getElementById('gamefox-message'))
      {
        try
        {
          var node = gContextMenu.target;

          while (node.nodeName.toLowerCase() != 'table'
                 || node.className.toLowerCase() != 'message')
          {
            node = node.offsetParent;
          }

          hideQuote = false;
        }
        catch (e) {}
      }
    }
    document.getElementById('gamefox-context-quote').hidden = hideQuote
      || !GameFOX.prefs.getBoolPref('context.quote');
    document.getElementById('gamefox-context-usergroups').hidden = hideUsergroups
      || !GameFOX.prefs.getBoolPref('context.usergroups');

    var hideTag = true;
    var hidePages = true;
    if (!GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'myposts'))
    {
      // Tag topic (message list)
      if (GFlib.onPage(doc, 'messages') && doc.getElementsByTagName('h1').length > 1)
        hideTag = false;
    }
    else
    {
      // Tag topic and pages (topic list)
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
        }
      }
      catch (e) {}
    }
    document.getElementById('gamefox-context-tag').hidden = hideTag
      || !GameFOX.prefs.getBoolPref('context.tag');
    document.getElementById('gamefox-context-pages').hidden = hidePages
      || !GameFOX.prefs.getBoolPref('context.pagelist');
  }
};
