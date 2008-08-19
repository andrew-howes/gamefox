/* vim: set et sw=2 sts=2 ts=2: */

var GFUL =
{
  Cc: Components.classes,
  Ci: Components.interfaces,
  prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
      Components.interfaces.nsIPrefService).getBranch('gamefox.'),

  add: function()
  {
    var userlist = eval(this.prefs.getCharPref("userlist.serialized"));

    userlist.push({"name": "", "color": "#CCFFFF", "users": "",
        "messages": "highlight", "topics": "highlight"});

    this.prefs.setCharPref("userlist.serialized", userlist.toSource());
    this.populate();
  },

  populate: function()
  {
    var groupbox, caption, hbox, textbox, separator, colorpicker, label, radiogroup, radio, button;
    var radios;

    // This is pretty verbose
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));

    var vbox = document.getElementById('usergroups');
    if (vbox.hasChildNodes())
      while (vbox.childNodes.length >= 1)
        vbox.removeChild(vbox.firstChild);

    for (i in userlist)
    {
      /* groupbox */
      groupbox = document.createElement('groupbox');
      groupbox.id = 'ug-' + i;

      /** caption **/
      caption = document.createElement('caption');
      caption.setAttribute('label', 'User Group');
      groupbox.appendChild(caption);
      /** hbox **/
      hbox = document.createElement('hbox');
      hbox.setAttribute('align', 'center');

      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('emptytext', 'Group Name');
      textbox.setAttribute('class', 'ug-name');
      textbox.setAttribute('value', userlist[i]['name']);
      textbox.addEventListener('keyup', this.updatePref, false);
      hbox.appendChild(textbox);
      /*** separator **/
      separator = document.createElement('separator');
      separator.setAttribute('flex', '1');
      hbox.appendChild(separator);
      /*** button ***/
      button = document.createElement('button');
      button.setAttribute('label', 'Delete');
      button.setAttribute('icon', 'remove');
      button.addEventListener('command', this.removeWithButton, false);
      hbox.appendChild(button);
      /*** separator ***/
      separator = document.createElement('separator');
      separator.setAttribute('flex', '1');
      hbox.appendChild(separator);
      /*** colorpicker ***/
      colorpicker = document.createElement('colorpicker');
      colorpicker.setAttribute('type', 'button');
      colorpicker.setAttribute('class', 'ug-color');
      colorpicker.setAttribute('color', userlist[i]['color']);
      colorpicker.addEventListener('change', this.updatePref, false);
      hbox.appendChild(colorpicker);
      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('size', '6');
      textbox.setAttribute('value', userlist[i]['color']);
      textbox.setAttribute('class', 'ug-color');
      textbox.addEventListener('keyup', this.updatePref, false);
      hbox.appendChild(textbox);

      groupbox.appendChild(hbox);

      /** hbox **/
      hbox = document.createElement('hbox');
      hbox.setAttribute('align', 'center');

      /*** label ***/
      label = document.createElement('label');
      label.setAttribute('value', 'Users:');
      hbox.appendChild(label);
      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('class', 'ug-users');
      textbox.setAttribute('value', userlist[i]['users']);
      textbox.setAttribute('flex', '1');
      textbox.addEventListener('keyup', this.updatePref, false);
      hbox.appendChild(textbox);

      groupbox.appendChild(hbox);

      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');
      radiogroup.setAttribute('class', 'ug-messages');
      radiogroup.addEventListener('click', this.updatePref, false);

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Collapse messages');
      radio.setAttribute('value', 'collapse');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove messages');
      radio.setAttribute('value', 'remove');
      /* I couldn't find another easy way to do this: radiogroup.selectedIndex
         isn't set until this loop is over, which would require another loop to
         set all the radios. */
      if (userlist[i]['messages'] == 'remove')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight messages');
      radio.setAttribute('value', 'highlight');
      if (userlist[i]['messages'] == 'highlight')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radio.setAttribute('value', 'nothing');
      if (userlist[i]['messages'] == 'nothing')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);
      
      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');
      radiogroup.setAttribute('class', 'ug-topics');
      radiogroup.addEventListener('click', this.updatePref, false);

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove topics');
      radio.setAttribute('value', 'remove');
      if (userlist[i]['topics'] == 'remove')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight topics');
      radio.setAttribute('value', 'highlight');
      if (userlist[i]['topics'] == 'highlight')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radio.setAttribute('value', 'nothing');
      if (userlist[i]['topics'] == 'nothing')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);

      vbox.appendChild(groupbox);
    }
  },

  updatePref: function(event)
  {
    // get user group index
    var node = parentNode = event.target;
    while (parentNode.id.indexOf('ug') == -1)
      parentNode = parentNode.parentNode;
    var idx = parentNode.id.substring(3);

    if (node.tagName == 'radio')
      node = node.parentNode;

    // get pref name
    var name = node.className.substring(3);

    // get value
    if (node.tagName == 'colorpicker')
      var value = node.color;
    else
      var value = node.value;

    // color has 2 elements to update
    if (name == 'color')
    {
      var colors = parentNode.getElementsByClassName('ug-color');
      for (i in colors)
        if (colors[i].tagName == 'colorpicker')
          colors[i].color = value;
        else
          colors[i].value = value;
    }

    // get and set pref
    var userlist = eval(GFUL.prefs.getCharPref('userlist.serialized'));
    userlist[idx][name] = value;
    GFUL.prefs.setCharPref('userlist.serialized', userlist.toSource());
  },

  loadGroups: function()
  {
    var usernames, username;
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    this.usernameIndex = {};

    // build the index
    for (i in userlist)
    {
      usernames = userlist[i]['users'].split(/\s*,\s*/);
      for (j in usernames)
      {
        var username = GameFOXUtils.trim(usernames[j]);
        if (!username.length) continue;

        if (this.usernameIndex[username])
          this.usernameIndex[username].push(i);
        else
          this.usernameIndex[username] = new Array(i);
      }
    }
  },

  searchUsername: function(username)
  {
    if (!this.usernameIndex) return false; // no index

    username = GameFOXUtils.trim(username);
    if (!username.length) return false;

    if (!this.usernameIndex[username]) return false; // username isn't in any groups

    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    var groups = this.usernameIndex[username];

    // first group decides everything
    var color = userlist[groups[0]]['color'];
    var messages = userlist[groups[0]]['messages'];
    var topics = userlist[groups[0]]['topics'];

    // list of all groups where the user is present
    var groupNames = "";
    var name;
    for (i in groups)
    {
      name = userlist[groups[i]]['name'];
      if (!name.length) continue;

      groupNames += name + ", ";
    }
    groupNames = groupNames.length ? "(" + groupNames.substring(0,
          groupNames.length - 2) + ")" : "";

    return [groupNames, color, messages, topics];
  },

  removeWithButton: function(event)
  {
    var id = event.target.parentNode.parentNode.id.substring(3);
    var userlist = eval(GFUL.prefs.getCharPref('userlist.serialized'));

    if (userlist[id]['name'].length)
    {
      if (!confirm('Really delete the group "' + userlist[id]['name'] + '"?'))
        return;
    }
    else
    {
      if (!confirm('Really delete group ' + (parseInt(id) + 1) + '?'))
        return;
    }

    userlist.splice(id, 1);
    GFUL.prefs.setCharPref('userlist.serialized', userlist.toSource());
    GFUL.populate();
  }
};