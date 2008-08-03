/* vim: set et sw=2 sts=2 ts=2: */

function gfox_addTab(aUrl, focusType)
{
  var browserWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
  var browser       = browserWindow.getBrowser();
  var newTab        = browser.addTab(aUrl);
  if (focusType == 0) {
    browser.selectedTab = newTab;
  }
}

function gfox_processAboutDialog()
{
  // empty
}

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
  path.value = (doc.location.protocol.match(/^https?:$/i) && doc.location.host.match(/(^|\.)gamefaqs\.com$/i)) ? doc.location.href.replace(/&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/ig, '') : 'http://boards.gamefaqs.com/gfaqs/';
}
