/* vim: set et sw=2 ts=2 sts=2 tw=79: */

/***********************************************************
constants
***********************************************************/
const CLASS_ID = Components.ID('{c1f33b60-3c10-11de-8a39-0800200c9a66}');
const CLASS_NAME = 'GameFOX date getter';
const CONTRACT_ID = '@gamefox/dategetter;1';
const host = 'www.gamefaqs.com';
const prefs = Components.classes['@mozilla.org/preferences-service;1']
  .getService(Components.interfaces.nsIPrefService)
  .getBranch('gamefox.');

/***********************************************************
class definition
***********************************************************/
var GFdateGetter =
{
  observe: function(aSubject, aTopic, aData)
  {
    if (aTopic == 'http-on-examine-response')
    {
      aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
      try
      {
        if (aSubject.getRequestHeader('Host') == host)
          prefs.setCharPref('date', aSubject.getResponseHeader('Date'));
      }
      catch (e) {}
    }
    else if (aTopic == 'app-startup')
    {
      Components.classes['@mozilla.org/observer-service;1']
        .getService(Components.interfaces.nsIObserverService)
        .addObserver(this, 'http-on-examine-response', false);
    }
  },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIObserver) &&
        !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/***********************************************************
class factory
***********************************************************/
var GFdateGetterFactory =
{
  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return GFdateGetter;
  }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var GFdateGetterModule =
{
  registerSelf: function(aCompMgr, aLocation, aLoaderStr, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
      .registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID,
          aLocation, aLoaderStr, aType);

    var catMgr = Components.classes['@mozilla.org/categorymanager;1']
      .getService(Components.interfaces.nsICategoryManager);
    catMgr.deleteCategoryEntry('app-startup', CONTRACT_ID, true);
    catMgr.addCategoryEntry('app-startup', CONTRACT_ID, CONTRACT_ID, true,
        true);
  },

  unregisterSelf: function(aCompMgr, aLocation, aLoaderStr)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
      .unregisterFactoryLocation(CLASS_ID, aLocation);

    Components.classes['@mozilla.org/categorymanager;1']
      .getService(Components.interfaces.nsICategoryManager)
      .deleteCategoryEntry('app-startup', CONTRACT_ID, true);
  },

  getClassObject: function(aCompMgr, aClass, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aClass.equals(CLASS_ID))
      return GFdateGetterFactory;

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
  return GFdateGetterModule;
}
