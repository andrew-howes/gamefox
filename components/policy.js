/***********************************************************
constants
***********************************************************/
const nsIContentPolicy = Components.interfaces.nsIContentPolicy;
const nsISupports = Components.interfaces.nsISupports;
const CLASS_ID = Components.ID('{2572941e-68cb-41a8-be97-cbb40611dcbc}');
const CLASS_NAME = 'GameFOX content policy';
const CONTRACT_ID = '@gamefox/contentpolicy;1';

/***********************************************************
class definition
***********************************************************/
// constructor
function GFcontentPolicy()
{
  this.wrappedJSObject = this;
};

// definition
GFcontentPolicy.prototype =
{
  shouldLoad: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra)
  {
    if (Components.classes['@mozilla.org/preferences-service;1']
            .getService(Components.interfaces.nsIPrefBranch)
            .getBoolPref('gamefox.theme.disablegamefaqscss') &&
        contentLocation.host == 'www.gamefaqs.com' &&
        contentType == nsIContentPolicy.TYPE_STYLESHEET)
      return nsIContentPolicy.REJECT_REQUEST;
    else
      return nsIContentPolicy.ACCEPT;
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
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return (new GFcontentPolicy()).QueryInterface(aIID);
  }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var GFcontentPolicyModule =
{
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
        .registerFactoryLocation(CLASS_ID, CLASS_NAME, 
            CONTRACT_ID, aFileSpec, aLocation, aType);

    var catMgr = Components.classes['@mozilla.org/categorymanager;1']
        .getService(Components.interfaces.nsICategoryManager);
    catMgr.deleteCategoryEntry('content-policy', CONTRACT_ID, true);
    catMgr.addCategoryEntry('content-policy', CONTRACT_ID, CONTRACT_ID, true,
        true);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
        .unregisterFactoryLocation(CLASS_ID, aLocation);

    Components.classes['@mozilla.org/categorymanager;1']
        .getService(Components.interfaces.nsICategoryManager)
        .deleteCategoryEntry('content-policy', CONTRACT_ID, true);
  },

  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return GFcontentPolicyFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

/***********************************************************
module initialization
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec) { return GFcontentPolicyModule; }
