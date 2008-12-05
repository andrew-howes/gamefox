/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan, Andrianto Effendy
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

var GFlib =
{
  domain: 'http://www.gamefaqs.com',
  path: '/boards/',

  version: Cc['@mozilla.org/extensions/manager;1']
    .getService(Ci.nsIExtensionManager)
    .getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}')
    .version,

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
    if (event.target && event.target.ownerDocument)
      return event.target.ownerDocument;
    else if (event.originalTarget)
      return event.originalTarget;
    else
      return event;
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

  open: function(tagID, openType)
  {
    var IDs = tagID.split(',');
    var tagURI = GFlib.domain + GFlib.path;

    if (IDs[1] == -1)
    {
      tagURI += 'myposts.php';
    }
    else if (IDs[1] == -2)
    {
      tagURI += 'tracked.php';
    }
    else
    {
      tagURI += (IDs[1] ? 'genmessage.php' : 'gentopic.php')
                + '?board=' + IDs[0] + (IDs[1] ? '&topic=' + IDs[1]
                + (IDs[2] && parseInt(IDs[2]) ? '&page=' + IDs[2]
                + (IDs[3] ? IDs[3] : '') : '') : '');
    }

    var win = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser');

    switch (openType)
    {
      case 0: // new tab
        try
        {
          win.getBrowser().addTab(tagURI);
        }
        catch (e)
        {
          win.loadURI(tagURI);
        }
        break;
      case 1: // new focused tab
        try
        {
          win.delayedOpenTab(tagURI);
        }
        catch (e)
        {
          win.loadURI(tagURI);
        }
        break;
      case 2: // focused tab
        win.loadURI(tagURI);
        break;
      case 3: // new window
        win.open(tagURI);
        break;
    }
  },

  newTab: function(url, focus)
  {
    var browser = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser')
      .getBrowser();

    var tab = browser.addTab(url);
    if (focus == 0)
      browser.selectedTab = tab;
  },

  thirdPartyCookieFix: function(request)
  {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=437174
    var ds = Cc['@mozilla.org/webshell;1']
      .createInstance(Ci.nsIDocShellTreeItem)
      .QueryInterface(Ci.nsIInterfaceRequestor);
    request.channel.loadGroup = ds.getInterface(Ci.nsILoadGroup);
    request.channel.loadFlags |= Ci.nsIChannel.LOAD_DOCUMENT_URI;
    return ds;
  }
};
