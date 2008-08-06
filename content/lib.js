/* vim: set et sw=2 sts=2 ts=2: */

var GFlib =
{
  getDocument: function(evt)
  {
    return evt.originalTarget;
  },

  onGF: function()
  {
    return GameFOX.doc.location.host.match(/(^|\.)gamefaqs\.com$/i) != null;
  },

  onPage: function(page)
  {
    return GameFOX.doc.location.pathname.match(new RegExp("^/boards/" + page + "\\.php"));
  },

  setTitle: function(title)
  {
    if (!GameFOX.prefs.getBoolPref("elements.titlechange")) return false;

    var prefix = "GameFAQs: ";
    if (GameFOX.doc.defaultView.parent != GameFOX.doc.defaultView.self) // we're in a frame
      GameFOX.doc.defaultView.parent.document.title = prefix + title;
    else
      GameFOX.doc.title = prefix + title;
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
