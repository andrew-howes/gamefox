/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan
 *
 * This file is part of GameFOX.
 *
 * GameFOX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * GameFOX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GameFOX.  If not, see <http://www.gnu.org/licenses/>.
 */

var gamefox_options_highlighting =
{
  prepareOptionsPane: function()
  {
    this.populate();

    // watch for changes caused by menuCheckChange
    new gamefox_observer('userlist.serialized', this.updateUsers);
  },

  makeGroupbox: function(id, name, color, users)
  {
    var strbundle = document.getElementById('highlighting-strings');
    var groupbox, caption, hbox, textbox, separator, colorpicker, label,
        button, menulist, menupopup, menuitem;

    /* groupbox */
    groupbox = document.createElement('groupbox');
    groupbox.id = 'ug-' + id;

    /** caption **/
    caption = document.createElement('caption');
    caption.setAttribute('label',
        strbundle.getFormattedString('groupNum', [id + 1]));
    groupbox.appendChild(caption);

    /** hbox **/
    hbox = document.createElement('hbox');
    hbox.setAttribute('align', 'center');

    /*** textbox ***/
    textbox = document.createElement('textbox');
    textbox.setAttribute('emptytext', strbundle.getString('groupName'));
    textbox.setAttribute('class', 'ug-name');
    textbox.setAttribute('value', name);
    textbox.addEventListener('input', this.updatePref, false);
    hbox.appendChild(textbox);
    /*** separator ***/
    separator = document.createElement('separator');
    separator.setAttribute('flex', '1');
    hbox.appendChild(separator);
    /*** colorpicker ***/
    colorpicker = document.createElement('colorpicker');
    colorpicker.setAttribute('type', 'button');
    colorpicker.setAttribute('class', 'ug-color');
    colorpicker.setAttribute('color', color);
    colorpicker.addEventListener('change', this.updatePref, false);
    hbox.appendChild(colorpicker);
    /*** textbox ***/
    textbox = document.createElement('textbox');
    textbox.setAttribute('size', '6');
    textbox.setAttribute('class', 'ug-color');
    textbox.setAttribute('value', color);
    textbox.addEventListener('input', this.updatePref, false);
    hbox.appendChild(textbox);
    /*** separator **/
    separator = document.createElement('separator');
    separator.setAttribute('flex', '1');
    hbox.appendChild(separator);
    /*** button ***/
    button = document.createElement('button');
    button.setAttribute('label', strbundle.getString('delete'));
    button.setAttribute('icon', 'remove');
    button.addEventListener('command', this.removeWithButton, false);
    hbox.appendChild(button);
    groupbox.appendChild(hbox);

    /** hbox **/
    hbox = document.createElement('hbox');
    hbox.setAttribute('align', 'center');

    /*** menulist ***/
    menulist = document.createElement('menulist');
    menulist.setAttribute('class', 'ug-type');
    menulist.addEventListener('command', this.updatePref, false);

    /**** menupopup ****/
    menupopup = document.createElement('menupopup');

    var typeSettings = new Array(
        'users', 'usernameIs',
        'titleContains', 'titleContains',
        'postContains', 'postContains'
        );
    /***** menuitem *****/
    for (var i = 0; i < typeSettings.length; i += 2)
    {
      menuitem = document.createElement('menuitem');
      menuitem.setAttribute('label', strbundle.getString(typeSettings[i + 1]));
      menuitem.setAttribute('value', typeSettings[i]);
      menupopup.appendChild(menuitem);
    }

    menulist.appendChild(menupopup);
    hbox.appendChild(menulist);

    /*** textbox ***/
    textbox = document.createElement('textbox');
    textbox.setAttribute('class', 'ug-users');
    textbox.setAttribute('value', users);
    textbox.setAttribute('flex', '1');
    textbox.addEventListener('input', this.updatePref, false);
    hbox.appendChild(textbox);

    groupbox.appendChild(hbox);

    /** hbox **/
    hbox = document.createElement('hbox');
    hbox.setAttribute('align', 'center');
    hbox.setAttribute('pack', 'end');

    /*** menulist ***/
    menulist = document.createElement('menulist');
    menulist.setAttribute('class', 'ug-topics');
    menulist.addEventListener('command', this.updatePref, false);

    /**** menupopup ****/
    menupopup = document.createElement('menupopup');

    var tpcSettings = new Array(
        'remove', 'removeTopics',
        'highlight', 'highlightTopics',
        'nothing', 'noTopicAction'
        );
    /***** menuitem *****/
    for (var i = 0; i < tpcSettings.length; i += 2)
    {
      menuitem = document.createElement('menuitem');
      menuitem.setAttribute('label', strbundle.getString(tpcSettings[i + 1]));
      menuitem.setAttribute('value', tpcSettings[i]);
      menupopup.appendChild(menuitem);
    }

    menulist.appendChild(menupopup);
    hbox.appendChild(menulist);

    /*** menulist ***/
    menulist = document.createElement('menulist');
    menulist.setAttribute('class', 'ug-messages');
    menulist.addEventListener('command', this.updatePref, false);
    
    /**** menupopup ****/
    menupopup = document.createElement('menupopup');

    var msgSettings = new Array(
        'collapse', 'collapseMessages',
        'remove', 'removeMessages',
        'highlight', 'highlightMessages',
        'nothing', 'noMessageAction'
        );
    /***** menuitem *****/
    for (var i = 0; i < msgSettings.length; i += 2)
    {
      menuitem = document.createElement('menuitem');
      menuitem.setAttribute('label', strbundle.getString(msgSettings[i + 1]));
      menuitem.setAttribute('value', msgSettings[i]);
      menupopup.appendChild(menuitem);
    }

    menulist.appendChild(menupopup);
    hbox.appendChild(menulist);

    groupbox.appendChild(hbox);

    return groupbox;
  },

  populate: function()
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
    var vbox = document.getElementById('groups');

    for (var i = 0; i < userlist.length; i++)
      vbox.appendChild(this.makeGroupbox(
          i, userlist[i].name, userlist[i].color, userlist[i].users));

    // if called directly, will throw "TypeError: this.mColorBox has no properties"
    setTimeout(gamefox_options_highlighting.setDefaultValues, 0);
  },

  setDefaultValues: function()
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
    var vbox = document.getElementById('groups');
    var groups = vbox.getElementsByTagName('groupbox');
    for (var i = 0; i < groups.length; i++)
    {
      // set colorpicker, mostly because of fx2
      groups[i].getElementsByTagName('colorpicker')[0]
        .color = userlist[i].color;

      // set menulists
      var idx;
      idx = {users:0, titleContains:1, postContains:2};
      groups[i].getElementsByTagName('menulist')[0]
        .selectedIndex = idx[userlist[i].type];

      idx = {remove:0, highlight:1, nothing:2};
      groups[i].getElementsByTagName('menulist')[1]
        .selectedIndex = idx[userlist[i].topics];

      idx = {collapse:0, remove:1, highlight:2, nothing:3};
      groups[i].getElementsByTagName('menulist')[2]
        .selectedIndex = idx[userlist[i].messages];

      gamefox_options_highlighting.disableMenulists(userlist[i].type, groups[i]);
    }
  },

  populateLast: function()
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
    var id = userlist.length - 1;
    userlist = userlist[id];
    var vbox = document.getElementById('groups');
    var groupbox = this.makeGroupbox(
        id, userlist.name, userlist.color, userlist.users);
    vbox.appendChild(groupbox);

    // set colorpicker, mostly because of fx2
    groupbox.getElementsByTagName('colorpicker')[0].color = userlist.color;

    // set menulists
    var idx;
    idx = {users:0, titleContains:1, postContains:2};
    groupbox.getElementsByTagName('menulist')[0]
      .selectedIndex = idx[userlist.type];

    idx = {remove:0, highlight:1, nothing:2};
    groupbox.getElementsByTagName('menulist')[1]
      .selectedIndex = idx[userlist.topics];

    idx = {collapse:0, remove:1, highlight:2, nothing:3};
    groupbox.getElementsByTagName('menulist')[2]
      .selectedIndex = idx[userlist.messages];
  },

  updatePref: function(event)
  {
    // get user group index
    var node = parentNode = event.target;
    while (parentNode.id.indexOf('ug') == -1)
      parentNode = parentNode.parentNode;
    var idx = parentNode.id.substring(3);

    if (node.tagName == 'menuitem')
      node = node.parentNode.parentNode;

    var groupbox = node;
    while (groupbox.tagName != 'groupbox')
      groupbox = groupbox.parentNode;

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
      var colors = parentNode.getElementsByTagName('*');
      for (var i = 0; i < colors.length; i++)
      {
        if (colors[i].className != 'ug-color') continue;

        if (colors[i].tagName == 'colorpicker')
          colors[i].color = value;
        else
          colors[i].value = value;
      }
    }

    // disable options that don't apply
    if (name == 'type')
      gamefox_options_highlighting.disableMenulists(value, groupbox);

    // get and set pref
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
    userlist[idx][name] = value;
    gamefox_lib.prefs.setCharPref('userlist.serialized', userlist.toSource());
  },

  updateUsers: function()
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
    var groups = document.getElementById('groups')
      .getElementsByTagName('groupbox');
    var textboxes;
    for (var i = 0; i < groups.length; i++)
    {
      // only update the list of users
      textboxes = groups[i].getElementsByTagName('textbox');
      for (var j = 0; j < textboxes.length; j++)
        if (textboxes[j].className == 'ug-users' &&
            textboxes[j].value != userlist[i].users)
          textboxes[j].value = userlist[i].users;
    }
  },

  removeWithButton: function(event)
  {
    var groupbox = event.target.parentNode.parentNode;
    var id = groupbox.id.substring(3);
    var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));

    if (userlist[id].name.length)
    {
      if (!gamefox_lib.confirm('Really delete the group "' + userlist[id].name + '"?'))
        return;
    }
    else
    {
      if (!gamefox_lib.confirm('Really delete group #' + (parseInt(id) + 1) + '?'))
        return;
    }

    // in case user hits button twice; however, bad things can still happen
    // if the user leaves one of the confirms open and adds/deletes, since the
    // prefs will no longer match the groupboxes
    if (groupbox.parentNode)
    {
      var vbox = document.getElementById('groups');
      vbox.removeChild(groupbox);
      var groups = vbox.getElementsByTagName('groupbox');
      for (var i = parseInt(id); i < groups.length; i++)
      {
        groups[i].id = 'ug-' + i;
        groups[i].getElementsByTagName('caption')[0].setAttribute('label', 'Group #' + (i + 1));
      }
    }

    userlist.splice(id, 1);
    gamefox_lib.prefs.setCharPref('userlist.serialized', userlist.toSource());
  },

  disableMenulists: function(type, groupbox)
  {
    var menulists = groupbox.getElementsByTagName('menulist');
    if (type == 'titleContains')
    {
      menulists[1].disabled = false;
      menulists[2].disabled = true;
    }
    else if (type == 'postContains')
    {
      menulists[1].disabled = true;
      menulists[2].disabled = false;
    }
    else
    {
      menulists[1].disabled = false;
      menulists[2].disabled = false;
    }
  }
}
