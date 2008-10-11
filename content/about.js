/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFabout =
{
  process: function()
  {
    var em = Cc['@mozilla.org/extensions/manager;1'].getService(Ci.nsIExtensionManager);

    document.getElementById('version').setAttribute('value',
        document.getElementById('version').getAttribute('value')
        + em.getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}').version);
  }
};

window.addEventListener('load', GFabout.process, false);
