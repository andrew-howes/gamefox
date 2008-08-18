/* vim: set et sw=2 sts=2 ts=2: */

var GFlib =
{
  domain: 'http://www.gamefaqs.com',
  path: '/boards/',

  log: function(msg)
  {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1'].
      getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage('GameFOX: ' + msg);
  },

  getDocument: function(event)
  {
    if (event.target.ownerDocument)
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
     - For normal page, if it is not loaded successfully and therefore Firefox
       displays its custom warning page (e.g. Server not found), then its
       document.location.host and document.location.hostname properties remain
       pointing to the original URI, but its document.domain property content
       will be null. Expect rubbish in the error console, and possibly a
       breakage, if the above anomalies are not handled properly.
   */
  onGF: function(doc)
  {
    return /(^|\.)gamefaqs\.com$/.test(doc.domain);
  },

  onBoards: function(doc)
  {
    if (!GFlib.onGF(doc)) return false;
    return /^\/boards(\/|$|\?)/.test(doc.location.pathname);
  },

  onPage: function(doc, page)
  {
    if (doc.gfPage)
      return doc.gfPage.indexOf(page) != -1;

    // gfPage is an array because of overlapping pages, e.g. message detail and messages
    switch (page)
    {
      case 'index':
        var h1 = doc.evaluate('//div[@class="pod"]/div[@class="head"]/h1', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (h1 && h1.textContent == 'Board Information')
        {
          doc.gfPage = ['index'];
          return true;
        }
        else
          return false;

      case 'topics':
        var col = doc.evaluate('//col[@class="status"]', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        var notopics = doc.evaluate('//div[@id="board_wrap"]/p', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if ((notopics && notopics.textContent.indexOf('No topics are available') != -1)
            || col)
        {
          doc.gfPage = ['topics'];
          return true;
        }
        else
          return false;

      case 'messages':
        var table = doc.evaluate('//table[@class="message"]', doc, null, XPathResult.
            FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (table != null)
        {
          if (GFlib.onPage(doc, 'detail'))
            doc.gfPage = ['messages', 'detail'];
          else if (doc.evaluate('//div[@class="user"]', doc, null, XPathResult.
                FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.indexOf(
                  'Topic Archived') != -1)
            doc.gfPage = ['messages', 'archive'];
          else
            doc.gfPage = ['messages'];
          return true;
        }
        else
          return false;

      default:
        return doc.location.pathname.match(new RegExp('^/boards/' + page + '\\.php'));
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
    var browser = Components.classes['@mozilla.org/appshell/window-mediator;1'].
      getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow(
          'navigator:browser').getBrowser();

    var tab = browser.addTab(url);
    if (focus == 0)
      browser.selectedTab = tab;
  }
};
