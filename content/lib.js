/* vim: set et sw=2 sts=2 ts=2: */

var GFlib =
{
  getDocument: function(evt)
  {
    return evt.originalTarget;
  },

  /*
     Facts, based on Firefox 2:
     - Host name normally can be fetched from document.location.host, document.location.hostname, and document.domain
       properties, as string.
     - If the page uses system protocol (e.g. about:<something>), then it might not have document.location.host and
       document.location.hostname properties, but it still has document.domain property whose content is null.
     - For normal page, if it is not loaded succesfully and therefore Firefox displays its custom warning page (e.g.
       Server not found), then its document.location.host and document.location.hostname properties remain pointing
       to the original URI, but its document.domain property content will be null.
     Expect rubbish in the error console, and possibly a breakage, if the above anomalies are not handled properly.
   */
  onGF: function()
  {
    try { return GameFOX.doc.domain.match(/(^|\.)gamefaqs\.com$/i) != null; }
    catch (e) { return false; }
  },

  onPage: function(page)
  {
    return GameFOX.doc.location.pathname.match(new RegExp("^/boards/" + page + "\\.php"));
  },

  setTitle: function(title, prefix)
  {
    if (!GameFOX.prefs.getBoolPref("elements.titlechange")) return false;

    GameFOX.doc.title = "GameFAQs"
                      + (prefix == null ? "" : ":" + (typeof prefix == "number" ? "" : " " ) + prefix)
                      + ": " + title;

    if (GameFOX.doc.defaultView.parent != GameFOX.doc.defaultView.self) // we're in a frame
      GameFOX.doc.defaultView.parent.document.title = GameFOX.doc.title;
  }
};

function gfox_addTab(aUrl, focusType)
{
  var browserWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
  var browser       = browserWindow.getBrowser();
  var newTab        = browser.addTab(aUrl);
  if (focusType == 0) {
    browser.selectedTab = newTab;
  }
}

function gfox_processAboutDialog() {}

function gfox_processSidebar()
{
  // For link middle-clicking
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++)
  {
    links[i].setAttribute('onmousedown', 'if (event.button == 1) gfox_addTab(this.href, 1)');
  }
}

function gfox_newTabLogin(loginForm)
{
  gfox_redirectLogin(loginForm);

  var browserWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
  browserWindow.BrowserOpenTab();

  var oldSubmitEvent = loginForm.getAttribute('onsubmit');
  loginForm.removeAttribute('onsubmit');
  loginForm.submit();
  loginForm.setAttribute('onsubmit', oldSubmitEvent);
}

function gfox_redirectLogin(loginForm)
{
  var doc    = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').content.document;
  var path   = loginForm.ownerDocument.getElementById('gamefaqs-login-path');
  path.value = (doc.location.protocol.match(/^https?:$/i) && doc.location.host.match(/(^|\.)gamefaqs\.com$/i)) ? doc.location.href.replace(/&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/ig, '') : 'http://www.gamefaqs.com/boards/';
}
