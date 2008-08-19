/* vim: set et sw=2 sts=2 ts=2: */

var GFContextMenu =
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

    if (!GFlib.onBoards(doc))
    {
      document.getElementById('gamefox-context-quote').hidden = true;
      document.getElementById('gamefox-context-tag').hidden = true;
      document.getElementById('gamefox-context-pages').hidden = true;
      return;
    }

    if (!GFlib.onPage(doc, 'messages') && doc.getElementById('gamefox-message'))
      document.getElementById('gamefox-context-quote').hidden = true;
    else
    { // Quote
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

        document.getElementById('gamefox-context-quote').hidden = false;
      }
      catch (e)
      {
        document.getElementById('gamefox-context-quote').hidden = true;
      }
    }

    if (!GFlib.onPage(doc, 'topics') && !GFlib.onPage(doc, 'myposts'))
    {
      if (!GFlib.onPage(doc, 'myposts') || !GameFOX.prefs.getBoolPref('context.tag'))
      { // Tag topic
        try
        {
          if (!doc.evaluate('//h1/following::h1', doc, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
            document.getElementById('gamefox-context-tag').hidden = true;
        }
        catch (e)
        {
          document.getElementById('gamefox-context-tag').hidden = true;
        }

        document.getElementById('gamefox-context-pages').hidden = true;
      }
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
