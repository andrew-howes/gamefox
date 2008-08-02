/* vim: set et sw=2 sts=2 ts=2: */

var GFUL =
{
  Cc: Components.classes,
  Ci: Components.interfaces,

  add: function()
  {
    var prefs = this.Cc["@mozilla.org/preferences-service;1"].getService(
        this.Ci.nsIPrefService).getBranch("gamefox.");

    var userlist = eval(prefs.getCharPref("userlist.serialized"));

    userlist.push({"name": "", "color": "", "users": "", "messages": "highlight", "topics": "highlight"});

    prefs.setCharPref("userlist.serialized", userlist.toSource());
  }
};
