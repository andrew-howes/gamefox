/* vim: set et sw=2 ts=2 sts=2 tw=79: */

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const nsIContentPolicy = Components.interfaces.nsIContentPolicy;
const nsISupports = Components.interfaces.nsISupports;
const adTest = /(2mdn\.net|adlegend\.com|advertising\.com|atdmt\.com|adimg\.cnet\.com|mads\.cnet\.com|surveys\.cnet\.com|adlog\.com\.com|dw\.com\.com|i\.i\.com\.com|contextweb\.com|doubleclick\.net|eyewonder\.com|adimg\.gamefaqs\.com|bwp\.gamefaqs\.com|mads\.gamefaqs\.com|bwp\.gamespot\.com|insightexpressai\.com|mediaplex\.com|pointroll\.com|questionmarket\.com|revsci\.net|scorecardresearch\.com|serving-sys\.com|specificclick\.net|tribalfusion\.com|turn\.com|unicast\.com|voicefive\.com|adserver\.yahoo\.com|yieldmanager\.com)$/;
const host = 'www.gamefaqs.com';
const prefs = Components.classes['@mozilla.org/preferences-service;1']
  .getService(Components.interfaces.nsIPrefService)
  .getBranch('gamefox.');

function GFcontentPolicy() { }

GFcontentPolicy.prototype =
{
  classDescription: 'GameFOX content policy',
  classID: Components.ID('{2572941e-68cb-41a8-be97-cbb40611dcbc}'),
  contractID: '@gamefox/contentpolicy;1',
  _xpcom_categories: [{ category: 'content-policy' }],
  QueryInterface: XPCOMUtils.generateQI([nsIContentPolicy, nsISupports]),

  shouldLoad: function(contentType, contentLocation, requestOrigin, context,
      mimeTypeGuess, extra)
  {
    try
    {
      if (requestOrigin.host != host)
        return nsIContentPolicy.ACCEPT;

      if ((prefs.getBoolPref('elements.stopads') &&
           contentType != nsIContentPolicy.TYPE_DOCUMENT &&
           contentLocation.host != host &&
           adTest.test(contentLocation.host)) ||
          (prefs.getBoolPref('theme.disablegamefaqscss') &&
           contentType == nsIContentPolicy.TYPE_STYLESHEET &&
           contentLocation.host == host))
        return nsIContentPolicy.REJECT_REQUEST;

      return nsIContentPolicy.ACCEPT;
    }
    catch (e)
    {
      // requestOrigin.host and contentLocation.host may throw exceptions
      return nsIContentPolicy.ACCEPT;
    }
  },

  shouldProcess: function(contentType, contentLocation, requestOrigin, context,
      mimeTypeGuess, extra)
  {
    return nsIContentPolicy.ACCEPT;
  },
};

// Backwards compatibility with Fx3
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([GFcontentPolicy]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([GFcontentPolicy]);
