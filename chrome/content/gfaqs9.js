/* [za]
 *
 * GameFOX overlay.js helper for gfaqs9 compatibility
 *
 */

var GameFOXNine =
{
  getNine: function(doc)
  {
    if (doc)
    {
      try
      {
        // advanced, detects gfaqs9 fingerprint: div#page > div[0].header
        //return (doc.getElementById('page').getElementsByTagName('div')[0].className.toLowerCase() == 'header') ? true : false;

        // simple: detects doc's url
        return (doc.location.pathname.match(/^\/gfaqs9(?=\/|$)/i)) ? true : false;
      }
      catch (e)
      {
        return false;
      }
    }
    return Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getBoolPref('gamefox.gfaqs9');
  },

  contextMenuDisplayQuote: function(contextMenu)
  {
    try
    {
      var node      = contextMenu.target;
      var nodeName  = node.nodeName.toLowerCase();
      var nodeClass = node.className.toLowerCase();

      while (nodeName != 'div' || nodeClass != 'box')
      {
        node      = node.parentNode;
        nodeName  = node.nodeName.toLowerCase();
        nodeClass = node.className.toLowerCase();
      }

      document.getElementById('gamefox-context-quote').hidden = false;
    }
    catch (e)
    {
      document.getElementById('gamefox-context-quote').hidden = true;
    }
  },

  msglistDblclick: function(event, dblclickHead, dblclickMsg)
  {
    var node      = event.target;
    var nodeName  = node.nodeName.toLowerCase();
    var nodeClass = node.className.toLowerCase();
    try
    {
      var tableNode      = node.parentNode;
      var tableNodeName  = tableNode.nodeName.toLowerCase();
      var tableNodeClass = tableNode.className.toLowerCase();

      while (tableNodeName != 'div' || tableNodeClass != 'box')
      {
        node           = tableNode;
        nodeName       = tableNodeName;
        nodeClass      = tableNodeClass;
        tableNode      = node.parentNode;
        tableNodeName  = tableNode.nodeName.toLowerCase();
        tableNodeClass = tableNode.className.toLowerCase();
      }
    }
    catch (e)
    {
      return;
    }


    if (dblclickHead != 0 && nodeClass == 'whitebox')
    {
      switch (dblclickHead)
      {
        case 1:
          GameFOX.quickWhois(event);
          break;
        case 2:
          GameFOXNine.quote(event);
          break;
      }
      return;
    }

    if (dblclickMsg && nodeClass == 'graybox')
    {
      GameFOXNine.quote(event);
    }
  },

  quote: function(event)
  {
    var node           = event.target;
    var nodeName       = node.nodeName.toLowerCase();
    var nodeClass      = node.className.toLowerCase();
    var tableNode      = node.parentNode;
    var tableNodeName  = tableNode.nodeName.toLowerCase();
    var tableNodeClass = tableNode.className.toLowerCase();
    try
    {
      while (tableNodeName != 'div' || tableNodeClass != 'box')
      {
        node           = tableNode;
        nodeName       = tableNodeName;
        nodeClass      = tableNodeClass;
        tableNode      = node.parentNode;
        tableNodeName  = tableNode.nodeName.toLowerCase();
        tableNodeClass = tableNode.className.toLowerCase();
      }
    }
    catch (e)
    {
      return;
    }


    var doc = event.target.ownerDocument;
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

    if (!doc.getElementById('gamefox-message'))
    {
      if (!prefs.getBoolPref('elements.quickpost.form')) {
        //alert('QuickPost form is disabled. Please enable it to enable quoting.');
      }
      return;
    }


    var quoteHead, quoteMsg;

    // in message header
    if (nodeClass == 'whitebox')
    {
      quoteHead = node.textContent;

      node = node.nextSibling.nextSibling;

      quoteMsg = node.innerHTML;
    }
    else
    // in message body
    if (nodeClass == 'graybox')
    {
      quoteMsg = node.innerHTML;

      node = node.previousSibling.previousSibling;

      quoteHead = node.textContent;
    }

    GameFOX.quoteProcessing(event, quoteHead, quoteMsg);
  }
};