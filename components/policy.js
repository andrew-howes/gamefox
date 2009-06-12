/* vim: set et sw=2 ts=2 sts=2 tw=79: */

/***********************************************************
constants
***********************************************************/
const nsIContentPolicy = Components.interfaces.nsIContentPolicy;
const nsISupports = Components.interfaces.nsISupports;
const CLASS_ID = Components.ID('{2572941e-68cb-41a8-be97-cbb40611dcbc}');
const CLASS_NAME = 'GameFOX content policy';
const CONTRACT_ID = '@gamefox/contentpolicy;1';
const adTest = /(2mdn\.net|adlegend\.com|advertising\.com|atdmt\.com|adimg\.cnet\.com|mads\.cnet\.com|surveys\.cnet\.com|adlog\.com\.com|dw\.com\.com|i\.i\.com\.com|contextweb\.com|doubleclick\.net|eyewonder\.com|adimg\.gamefaqs\.com|bwp\.gamefaqs\.com|mads\.gamefaqs\.com|bwp\.gamespot\.com|insightexpressai\.com|mediaplex\.com|pointroll\.com|questionmarket\.com|revsci\.net|serving-sys\.com|specificclick\.net|tribalfusion\.com|turn\.com|unicast\.com|voicefive\.com|adserver\.yahoo\.com|yieldmanager\.com)$/;
const host = 'www.gamefaqs.com';
const prefs = Components.classes['@mozilla.org/preferences-service;1']
  .getService(Components.interfaces.nsIPrefService)
  .getBranch('gamefox.');

/***********************************************************
class definition
***********************************************************/
function GFcontentPolicy()
{
  this.wrappedJSObject = this;
}

GFcontentPolicy.prototype =
{
  shouldLoad: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra)
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

  shouldProcess: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra)
  {
    return nsIContentPolicy.ACCEPT;
  },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(nsIContentPolicy) &&
        !aIID.equals(nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/***********************************************************
class factory
***********************************************************/
var GFcontentPolicyFactory =
{
  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return new GFcontentPolicy().QueryInterface(aIID);
  }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var GFcontentPolicyModule =
{
  registerSelf: function(aCompMgr, aLocation, aLoaderStr, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
      .registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID,
          aLocation, aLoaderStr, aType);

    var catMgr = Components.classes['@mozilla.org/categorymanager;1']
      .getService(Components.interfaces.nsICategoryManager);
    catMgr.deleteCategoryEntry('content-policy', CONTRACT_ID, true);
    catMgr.addCategoryEntry('content-policy', CONTRACT_ID, CONTRACT_ID, true,
        true);
  },

  unregisterSelf: function(aCompMgr, aLocation, aLoaderStr)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
      .unregisterFactoryLocation(CLASS_ID, aLocation);

    Components.classes['@mozilla.org/categorymanager;1']
      .getService(Components.interfaces.nsICategoryManager)
      .deleteCategoryEntry('content-policy', CONTRACT_ID, true);
  },

  getClassObject: function(aCompMgr, aClass, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aClass.equals(CLASS_ID))
      return GFcontentPolicyFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr)
  {
    return true;
  }
};

/***********************************************************
module initialization
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec)
{
  return GFcontentPolicyModule;
}
