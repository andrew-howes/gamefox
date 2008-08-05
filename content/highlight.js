/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFHL =
{
  loadGroups: function()
  {
    this.hlusernames = new Array(
        GameFOXUtils.trim(GameFOX.prefs.getCharPref('highlight.groups.1')).
        split(/\s*,\s*/g),
        GameFOXUtils.trim(GameFOX.prefs.getCharPref('highlight.groups.2')).
        split(/\s*,\s*/g)
        );
    this.hlcolors = new Array(
        GameFOX.prefs.getCharPref('highlight.colors.1'),
        GameFOX.prefs.getCharPref('highlight.colors.2')
        );
    this.ignore = GameFOX.prefs.getBoolPref('highlight.ignore');
  },

  getGroupData: function(username)
  {
    if (this.hlusernames.toString() == ',') return false;

    var hlgroup = 0;
    var hlindex = -1;

    if ((hlindex = this.hlusernames[0].indexOf(username)) == -1)
    { hlgroup = 1; var hlindex = this.hlusernames[1].indexOf(username); }

    if (hlindex == -1) return false;

    if (hlgroup == 0)
      return new Array("one", this.hlcolors[hlgroup], false);
    else
      return new Array("two", this.hlcolors[hlgroup], this.ignore);
  }
};
