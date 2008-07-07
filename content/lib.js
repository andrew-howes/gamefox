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
  var gfaqs9 = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getBoolPref('gamefox.gfaqs9');

  if (gfaqs9)
  {
    var links = document.getElementsByAttribute('class', 'url-label');
    for (var i = 0; i < links.length; i++)
    {
      links[i].setAttribute('value', links[i].getAttribute('value').replace(/:\/\/boards\.gamefaqs\.com\/gfaqs\b/i, '://boards.gamefaqs.com/gfaqs9'));
    }
  }
}

function gfox_processSidebar()
{
  var gfaqs9 = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getBoolPref('gamefox.gfaqs9');

  if (gfaqs9)
  {
    var content = document.getElementById('gamefox-sidebar-container');
    content.innerHTML = content.innerHTML.replace(/:\/\/boards\.gamefaqs\.com\/gfaqs\b(?!\/tracked\.)/ig, '://boards.gamefaqs.com/gfaqs9');
    // note that tracked.php will not be affected by gfaqs9 transformation
  }

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
  var gfaqs9 = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getBoolPref('gamefox.gfaqs9');
  var doc    = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').content.document;
  var path   = loginForm.ownerDocument.getElementById('gamefaqs-login-path');
  path.value = (doc.location.protocol.match(/^https?:$/i) && doc.location.host.match(/(^|\.)gamefaqs\.com$/i)) ? doc.location.href.replace(/&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/ig, '') : 'http://boards.gamefaqs.com/gfaqs' + (gfaqs9 ? '9' : '') + '/';
}
