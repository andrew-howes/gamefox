/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFSidebar =
{
  processLinks: function()
  {
    // link middle clicking
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++)
      links[i].setAttribute('onmousedown', 'if (event.button == 1) ' +
          'GFlib.newTab(this.href, 1)');
  },

  newTabLogin: function(form)
  {
    this.redirectLogin(form);

    var browserWindow = Components.classes['@mozilla.org/appshell/window-mediator;1'].
      getService(Components.interfaces.nsIWindowMediator).
      getMostRecentWindow('navigator:browser');
    browserWindow.BrowserOpenTab();

    var oldSubmitEvent = form.getAttribute('onsubmit');
    form.removeAttribute('onsubmit');
    form.submit();
    form.setAttribute('onsubmit', oldSubmitEvent);
  },

  redirectLogin: function(form)
  {
    var doc = Components.classes['@mozilla.org/appshell/window-mediator;1'].
      getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow(
          'navigator:browser').content.document;
    var path = form.ownerDocument.getElementById('gamefaqs-login-path');

    if (GFlib.onGF(doc))
      path.value = doc.location.href.replace(
          /&(action)=[^&]*(?=&|$)|\b(action)=[^&]*&/, '');
    else
      path.value = GFlib.domain + GFlib.path;
  }
};
