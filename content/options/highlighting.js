/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2012 Brian Marshall, Michael Ryan
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
  menulistMap: {
    type: { users: 0, titleContains: 1, postContains: 2 },
    topicAction: { highlight: 0, remove: 1, nothing: 2 },
    messageAction: { highlight: 0, remove: 1, collapse: 2, nothing: 3 }
  },

  prepareOptionsPane: function()
  {
    this.populate();

    // OS-specific arrow icons
    document.getElementById('paneHighlighting').setAttribute('platform',
        window.navigator.platform);

    new gamefox_pref_observer('userlist.serialized', this.watchPref);
  },

  populate: function()
  {
    var groups = gamefox_highlighting.read();
    var listbox = document.getElementById('grouplist');

    // Always make sure we have at least one group
    if (!groups.length)
    {
      gamefox_highlighting.add();
      groups = gamefox_highlighting.read();
    }

    for (var i = 0; i < groups.length; i++)
      listbox.appendItem(groups[i].name || 'Group #' + (i + 1));

    // If selectItem is called directly, it permanently prevents the first list
    // item from being selected. WTF?
    setTimeout(function() {
        var listbox = document.getElementById('grouplist');
        listbox.selectItem(listbox.getItemAtIndex(0));
        }, 0);
  },

  updatePref: function(event)
  {
    var groups = gamefox_highlighting.read();
    var i = document.getElementById('grouplist').selectedIndex;
    var updateActions = false;

    switch (event.id)
    {
      case 'name':
        groups[i].name = event.value;
        break;
      case 'color':
        groups[i].color = event.color;
        break;
      case 'colorHex':
        groups[i].color = event.value;
        break;
      case 'type':
        groups[i].type = event.selectedItem.value;
        updateActions = true;
        break;
      case 'values':
        groups[i].users = event.value;
        break;
      case 'include-admins':
      case 'include-mods':
      case 'include-vips':
      case 'include-tc':
        var includeType = event.id.substr(8);
        if (event.checked)
          groups[i].include.push(includeType);
        else
          groups[i].include.splice(groups[i].include.indexOf(includeType), 1);

        updateActions = true;
        break;
      case 'topicAction':
        groups[i].topics = event.selectedItem.value;
        break;
      case 'messageAction':
        groups[i].messages = event.selectedItem.value;
        break;
    }

    if (updateActions)
    {
      var actions = this.getAvailableActions(groups[i].type,
          groups[i].include);
      document.getElementById('topicAction').disabled = actions
        .indexOf('topics') == -1;
      document.getElementById('messageAction').disabled = actions
        .indexOf('messages') == -1;
    }

    gamefox_highlighting.write(groups);
  },

  delete: function()
  {
    var strbundle = document.getElementById('highlighting-strings');
    var groups = gamefox_highlighting.read();
    var i = document.getElementById('grouplist').selectedIndex;

    if (groups[i].name.length)
    {
      if (!gamefox_lib.confirm(strbundle.getFormattedString(
              'confirmDeleteNamedGroup', [groups[i].name])))
        return;
    }
    else
    {
      if (!gamefox_lib.confirm(strbundle.getFormattedString(
              'confirmDeleteGroup', [i + 1])))
        return;
    }

    groups.splice(i, 1);

    var listbox = document.getElementById('grouplist');
    listbox.removeItemAt(i);
    if (groups[i])
      listbox.selectedIndex = i;
    else
      listbox.selectedIndex = i - 1;

    gamefox_highlighting.write(groups);
  },

  loadGroup: function(listbox)
  {
    // Check for no selection - happens temporarily after a group is removed
    if (!listbox.selectedItem)
      return;

    var groups = gamefox_highlighting.read();
    var i = listbox.selectedIndex;

    // Disable delete button if this is the only group
    document.getElementById('delete').disabled = (listbox.itemCount == 1);

    // Disable arrow button if this is the first/last group
    document.getElementById('move-up').disabled = (i == 0);
    document.getElementById('move-down').disabled = ((i + 1) ==
        listbox.itemCount);

    // Load group settings
    document.getElementById('name').value = groups[i].name;
    document.getElementById('color').color = groups[i].color;
    document.getElementById('colorHex').value = groups[i].color;
    document.getElementById('type').selectedIndex = this.menulistMap
      .type[groups[i].type];
    document.getElementById('values').value = groups[i].users;
    gamefox_highlighting.extraTypes.forEach(function(element, index, array) {
        var checkbox = document.getElementById('include-' + element);
        var included = groups[i].include.indexOf(element) != -1;
        checkbox.checked = included;
        });
    document.getElementById('topicAction').selectedIndex = this.menulistMap
      .topicAction[groups[i].topics];
    document.getElementById('messageAction').selectedIndex = this.menulistMap
      .messageAction[groups[i].messages];

    // Disable action menulists depending on group type
    var actions = this.getAvailableActions(groups[i].type, groups[i].include);
    document.getElementById('topicAction').disabled = actions
      .indexOf('topics') == -1;
    document.getElementById('messageAction').disabled = actions
      .indexOf('messages') == -1;
  },

  watchPref: function()
  {
    var groups = gamefox_highlighting.read();
    var map = gamefox_options_highlighting.menulistMap;

    // Update listbox
    var listbox = document.getElementById('grouplist');
    var item;
    for (var i = 0; i < groups.length; i++)
    {
      if (i >= listbox.itemCount) // new group
        listbox.selectItem(listbox.appendItem('Group #' + (i + 1)));
      else // update name
        listbox.getItemAtIndex(i).label = groups[i].name || 'Group #' + (i + 1);
    }

    var i = document.getElementById('grouplist').selectedIndex;
    if (i == -1)
      return; // no selection, can't update group options

    // This function is called every time the userlist pref is updated, but we
    // don't know if the currently selected group has been updated or, if it
    // has, which setting of the group was updated

    var name = document.getElementById('name');
    if (name.value != groups[i].name)
      name.value = groups[i].name;

    var color = document.getElementById('color');
    if (color.color != groups[i].color)
      color.color = groups[i].color;

    var colorHex = document.getElementById('colorHex');
    if (colorHex.value != groups[i].color)
      colorHex.value = groups[i].color;

    var type = document.getElementById('type');
    if (type.selectedIndex != map.type[groups[i].type])
      type.selectedIndex = map.type[groups[i].type];

    var values = document.getElementById('values');
    if (values.value != groups[i].users)
      values.value = groups[i].users;

    gamefox_highlighting.extraTypes.forEach(function(element, index, array) {
        var checkbox = document.getElementById('include-' + element);
        var included = groups[i].include.indexOf(element) != -1;
        if (checkbox.checked != included) checkbox.checked = included;
        });

    var topicAction = document.getElementById('topicAction');
    if (topicAction.selectedIndex != map.topicAction[groups[i].topics])
      topicAction.selectedIndex = map.topicAction[groups[i].topics];

    var messageAction = document.getElementById('messageAction');
    if (messageAction.selectedIndex != map.messageAction[groups[i].messages])
      messageAction.selectedIndex = map.messageAction[groups[i].messages];
  },

  move: function(direction)
  {
    var groups = gamefox_highlighting.read();
    var listbox = document.getElementById('grouplist');
    var i = listbox.selectedIndex;
    var j = direction == 0 ? (i - 1) : (i + 1); // 0 : up :: 1 : down

    var swap1 = groups[i];
    var swap2 = groups[j];
    groups[i] = swap2;
    groups[j] = swap1;

    listbox.selectedIndex = -1;
    gamefox_highlighting.write(groups);
    listbox.selectedIndex = j;
  },

  getAvailableActions: function(type, include)
  {
    if (type == 'users'
        || include.indexOf('admins') != -1
        || include.indexOf('mods') != -1
        || include.indexOf('vips') != -1)
      return ['topics', 'messages'];

    var actions = [];
    if (['users', 'titleContains'].indexOf(type) != -1)
      actions.push('topics');

    if (['users', 'postContains'].indexOf(type) != -1
        || include.indexOf('tc') != -1)
      actions.push('messages');

    return actions;
  }
};
