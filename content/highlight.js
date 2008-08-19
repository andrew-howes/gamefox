/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFHL =
{
  loadGroups: function()
  {
    this.hlusernames = new Array(
        GameFOXUtils.trim(GameFOX.prefs.getCharPref('highlight.groups.1')).
        toLowerCase().split(/\s*,\s*/g),
        GameFOXUtils.trim(GameFOX.prefs.getCharPref('highlight.groups.2')).
        toLowerCase().split(/\s*,\s*/g)
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
    username = username.toLowerCase();

    var hlgroup = 0;
    var hlindex = -1;

    if ((hlindex = this.hlusernames[0].indexOf(username)) == -1)
    { hlgroup = 1; var hlindex = this.hlusernames[1].indexOf(username); }

    if (hlindex == -1) return false;

    if (hlgroup == 0)
      return new Array("one", this.hlcolors[hlgroup], false);
    else
      return new Array("two", this.hlcolors[hlgroup], this.ignore);
  },

  showPost: function(event)
  {
    event.preventDefault();

    var button = event.target;
    var doc = button.ownerDocument;
    var buttonContainer = button.offsetParent; // td
    var postMsg;

    var leftMsgData = !GameFOXUtils.getMsgDataDisplay(doc);
    if (leftMsgData)
    {
      postMsg = buttonContainer.offsetParent.rows[buttonContainer.parentNode.rowIndex + 1].cells[0];
      if (postMsg.style.fontSize == '0pt')
      {
        postMsg.style.removeProperty('font-size');
        postMsg.style.removeProperty('display');
        postMsg.removeAttribute('style');
        button.textContent = '[Hide]';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt',  'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.textContent = '[Show]';
      }
    }
    else
    {
      postMsg = buttonContainer.parentNode.cells[1];
      if (postMsg.style.fontSize == '0pt')
      {
        postMsg.style.removeProperty('font-size');
        postMsg.removeAttribute('style');
        buttonContainer.style.removeProperty('font-size');
        button.textContent = '[Hide]';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt',  'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.textContent = '[Show]';
      }
    }
  }
};
