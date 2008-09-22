/* vim: set et sw=2 sts=2 ts=2 tw=79: */

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

    // hide the entire menu
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
        if (node.nodeName == 'A'
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
          var nodeName = node.nodeName.toLowerCase();
          var nodeClass = node.className.toLowerCase();

          while (nodeName != 'table' || nodeClass != 'message')
          {
            node = node.offsetParent;
            nodeName = node.nodeName.toLowerCase();
            nodeClass = node.className.toLowerCase();
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

    if (!GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'myposts'))
    {
      // Tag topic
      if (GFlib.onPage(doc, 'messages') && GameFOX.prefs.getBoolPref('context.tag'))
      {
        if (!doc.evaluate('//h1/following::h1', doc, null,
              XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
          document.getElementById('gamefox-context-tag').hidden = true;
      }
      else
        document.getElementById('gamefox-context-tag').hidden = true;

      document.getElementById('gamefox-context-pages').hidden = true;
    }
    else if (!GameFOX.prefs.getBoolPref('context.tag') && !GameFOX.prefs.
        getBoolPref('context.pagelist'))
    {
      document.getElementById('gamefox-context-tag').hidden = true;
      document.getElementById('gamefox-context-pages').hidden = true;
    }
    else
    {
      try
      {
        var node = gContextMenu.target;
        var nodeName = node.nodeName.toLowerCase();

        while (nodeName != 'td')
        {
          node = node.parentNode;
          nodeName = node.nodeName.toLowerCase();
        }

        nodeName = node.parentNode.cells[1].nodeName; // will throw exception

        document.getElementById('gamefox-context-tag').hidden = !GameFOX.prefs.
          getBoolPref('context.tag');
        document.getElementById('gamefox-context-pages').hidden = !GameFOX.prefs.
          getBoolPref('context.pagelist');
      }
      catch (e)
      {
        document.getElementById('gamefox-context-tag').hidden = true;
        document.getElementById('gamefox-context-pages').hidden = true;
      }
    }
  }
};
