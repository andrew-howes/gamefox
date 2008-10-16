/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFlib =
{
  domain: 'http://www.gamefaqs.com',
  path: '/boards/',

  log: function(msg)
  {
    Cc['@mozilla.org/consoleservice;1']
        .getService(Ci.nsIConsoleService)
        .logStringMessage('GameFOX: ' + msg);
  },

  alert: function(msg)
  {
    Cc['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Ci.nsIPromptService)
        .alert(null, 'GameFOX', msg);
  },

  confirm: function(msg)
  {
    return Cc['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Ci.nsIPromptService)
        .confirm(null, 'GameFOX', msg);
  },

  getDocument: function(event)
  {
    if (!event.type)
      return event;
    else if (event.target.ownerDocument)
      return event.target.ownerDocument;
    else
      return event.originalTarget;
  },

  /*
     Facts, based on Firefox 2:
     - Host name normally can be fetched from document.location.host,
       document.location.hostname, and document.domain properties, as string.
     - If the page uses system protocol (e.g. about:<something>), then it might
       not have document.location.host and document.location.hostname
       properties, but it still has document.domain property whose content is
       null.
     - chrome: pages throw an exception when accessing document.domain.
     - For normal page, if it is not loaded successfully and therefore Firefox
       displays its custom warning page (e.g. Server not found), then its
       document.location.host and document.location.hostname properties remain
       pointing to the original URI, but its document.domain property content
       will be null.
   */
  onGF: function(doc)
  {
    try {
      return /(^|\.)gamefaqs\.com$/.test(doc.domain);
    }
    catch (e)
    {
      return false;
    }
  },

  onBoards: function(doc)
  {
    return GFlib.onGF(doc) && /^\/boards(\/|$|\?)/.test(doc.location.pathname);
  },

  onPage: function(doc, page)
  {
    if (doc.gamefox.pageType)
      return doc.gamefox.pageType.indexOf(page) != -1;

    // pageType is an array because of overlapping pages, e.g. message detail and messages
    switch (page)
    {
      case 'index':
        var h1 = doc.evaluate('//div[@class="pod"]/div[@class="head"]/h1', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (h1 != null && h1.textContent == 'Board Information')
        {
          doc.gamefox.pageType = ['index'];
          return true;
        }
        else
          return false;

      case 'topics':
        if (GFlib.onPage(doc, 'tracked'))
        {
          doc.gamefox.pageType = ['topics', 'tracked'];
          return true;
        }
        var col = doc.evaluate('//col[@class="status"]', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (col != null)
        {
          doc.gamefox.pageType = ['topics'];
          return true;
        }
        var notopics = doc.evaluate('//div[@id="board_wrap"]/p', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (notopics != null && notopics.textContent.indexOf('No topics are available') != -1)
        {
          doc.gamefox.pageType = ['topics'];
          return true;
        }
        else
          return false;

      case 'messages':
        var table = doc.evaluate('//table[@class="message"]', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (table != null && !GFlib.onPage(doc, 'post'))
        {
          var boards = doc.evaluate('//div[@class="board"]', doc, null,
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (boards.snapshotLength > 1)
            doc.gamefox.pageType = ['messages', 'detail'];
          else
          {
            var user = doc.evaluate('//div[@class="user"]', doc, null, XPathResult.
                FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (user != null && user.textContent.indexOf('Topic Archived') != -1)
              doc.gamefox.pageType = ['messages', 'archive'];
            else
              doc.gamefox.pageType = ['messages'];
          }
          return true;
        }
        else
          return false;

      default:
        return new RegExp('^/boards/' + page + '\\.php').test(doc.location.pathname);
    }
  },

  setTitle: function(doc, title, prefix, page)
  {
    if (!GameFOX.prefs.getBoolPref('elements.titlechange')) return false;
    if (!GameFOX.prefs.getBoolPref('elements.titleprefix')) prefix = null;

    doc.title = 'GameFAQs'
      + (prefix == null ? '' : ':' + prefix)
      + (page == null ? '' : ':' + page)
      + ': ' + title;

    if (doc.defaultView.parent != doc.defaultView.self) // we're in a frame
      doc.defaultView.parent.document.title = doc.title;
  },

  newTab: function(url, focus)
  {
    var browser = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).getMostRecentWindow(
          'navigator:browser').getBrowser();

    var tab = browser.addTab(url);
    if (focus == 0)
      browser.selectedTab = tab;
  }
};
