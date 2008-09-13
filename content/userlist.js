/* vim: set et sw=2 sts=2 ts=2: */

var GFuserlist =
{
  highlightClassName: 'gamefox-highlight',
  groupClassName: 'gamefox-groupname',

  prefs: Cc['@mozilla.org/preferences-service;1'].getService(
      Ci.nsIPrefService).getBranch('gamefox.'),

  add: function(name, color, users, messages, topics)
  {
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));

    name = (typeof name == 'string') ? name : '';
    color = (typeof color == 'string') ? color : '#CCFFFF';
    users = (typeof users == 'string') ? users : '';
    messages = (typeof messages == 'string') ? messages : 'highlight';
    topics = (typeof topics == 'string') ? topics : 'highlight';

    userlist.push({'name':name, 'color':color, 'users':users,
        'messages':messages, 'topics':topics});

    this.prefs.setCharPref('userlist.serialized', userlist.toSource());
  },

  makeGroupbox: function(id, name, color, users)
  {
    var groupbox, caption, hbox, textbox, separator, colorpicker, label, radiogroup, radio, button;

    /* groupbox */
    groupbox = document.createElement('groupbox');
    groupbox.id = 'ug-' + id;

    /** caption **/
    caption = document.createElement('caption');
    caption.setAttribute('label', 'Group #' + (id + 1));
    groupbox.appendChild(caption);

    /** hbox **/
    hbox = document.createElement('hbox');
    hbox.setAttribute('align', 'center');

    /*** textbox ***/
    textbox = document.createElement('textbox');
    textbox.setAttribute('emptytext', 'Group Name');
    textbox.setAttribute('class', 'ug-name');
    textbox.setAttribute('value', name);
    textbox.addEventListener('input', this.updatePref, false);
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
    textbox.setAttribute('value', users);
    textbox.setAttribute('flex', '1');
    textbox.addEventListener('input', this.updatePref, false);
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
    radiogroup.appendChild(radio);
    /*** radio ***/
    radio = document.createElement('radio');
    radio.setAttribute('label', 'Highlight messages');
    radio.setAttribute('value', 'highlight');
    radiogroup.appendChild(radio);
    /*** radio ***/
    radio = document.createElement('radio');
    radio.setAttribute('label', 'None');
    radio.setAttribute('value', 'nothing');
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
    radiogroup.appendChild(radio);
    /*** radio ***/
    radio = document.createElement('radio');
    radio.setAttribute('label', 'Highlight topics');
    radio.setAttribute('value', 'highlight');
    radiogroup.appendChild(radio);
    /*** radio ***/
    radio = document.createElement('radio');
    radio.setAttribute('label', 'None');
    radio.setAttribute('value', 'nothing');
    radiogroup.appendChild(radio);

    groupbox.appendChild(radiogroup);

    return groupbox;
  },

  populate: function()
  {
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    var vbox = document.getElementById('usergroups');

    for (var i = 0; i < userlist.length; i++)
      vbox.appendChild(this.makeGroupbox(
          i, userlist[i]['name'], userlist[i]['color'], userlist[i]['users']));

    // if called directly, will throw "TypeError: this.mColorBox has no properties"
    setTimeout(GFuserlist.setDefaultValues, 0);
  },

  setDefaultValues: function()
  {
    var userlist = eval(GFuserlist.prefs.getCharPref('userlist.serialized'));
    var vbox = document.getElementById('usergroups');
    var groups = vbox.getElementsByTagName('groupbox');
    for (var i = 0; i < groups.length; i++)
    {
      // set colorpicker, mostly because of fx2
      groups[i].getElementsByTagName('colorpicker')[0].color = userlist[i]['color'];

      // set radiogroups
      var idx;
      idx = {'collapse':0, 'remove':1, 'highlight':2, 'nothing':3};
      groups[i].getElementsByTagName('radiogroup')[0].selectedIndex = idx[userlist[i]['messages']];

      idx = {'remove':0, 'highlight':1, 'nothing':2};
      groups[i].getElementsByTagName('radiogroup')[1].selectedIndex = idx[userlist[i]['topics']];
    }
  },

  populateLast: function()
  {
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    var id = userlist.length - 1;
    userlist = userlist[id];
    var vbox = document.getElementById('usergroups');
    var groupbox = this.makeGroupbox(
        id, userlist['name'], userlist['color'], userlist['users']);
    vbox.appendChild(groupbox);

    // set colorpicker, mostly because of fx2
    groupbox.getElementsByTagName('colorpicker')[0].color = userlist['color'];

    // set radiogroups
    var idx;
    idx = {'collapse':0, 'remove':1, 'highlight':2, 'nothing':3};
    groupbox.getElementsByTagName('radiogroup')[0].selectedIndex = idx[userlist['messages']];

    idx = {'remove':0, 'highlight':1, 'nothing':2};
    groupbox.getElementsByTagName('radiogroup')[1].selectedIndex = idx[userlist['topics']];
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

    // get and set pref
    var userlist = eval(GFuserlist.prefs.getCharPref('userlist.serialized'));
    userlist[idx][name] = value;
    GFuserlist.prefs.setCharPref('userlist.serialized', userlist.toSource());
  },

  loadGroups: function()
  {
    var usernames, username;
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    this.usernameIndex = {};

    // build the index
    for (var i = 0; i < userlist.length; i++)
    {
      usernames = GFutils.trim(userlist[i]['users']).toLowerCase().split(/\s*,\s*/);
      for (var j = 0; j < usernames.length; j++)
      {
        username = usernames[j];
        if (!username.length) continue;

        if (this.usernameIndex[username])
          this.usernameIndex[username].push(i);
        else
          this.usernameIndex[username] = [i];
      }
    }
  },

  searchUsername: function(username)
  {
    if (!this.usernameIndex) return false; // no index

    username = GFutils.trim(username).toLowerCase();
    if (!username.length) return false;

    if (!this.usernameIndex[username]) return false; // username isn't in any groups

    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));
    var groups = this.usernameIndex[username];

    // first group decides everything
    var color = userlist[groups[0]]['color'];
    var messages = userlist[groups[0]]['messages'];
    var topics = userlist[groups[0]]['topics'];

    // list of all groups where the user is present
    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]]['name'].length)
        groupNames += userlist[groups[i]]['name'] + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages, topics, groups];
  },

  removeWithButton: function(event)
  {
    var groupbox = event.target.parentNode.parentNode;
    var id = groupbox.id.substring(3);
    var userlist = eval(GFuserlist.prefs.getCharPref('userlist.serialized'));

    if (userlist[id]['name'].length)
    {
      if (!confirm('Really delete the group "' + userlist[id]['name'] + '"?'))
        return;
    }
    else
    {
      if (!confirm('Really delete group #' + (parseInt(id) + 1) + '?'))
        return;
    }

    userlist.splice(id, 1);
    GFuserlist.prefs.setCharPref('userlist.serialized', userlist.toSource());

    // in case user hits button twice; however, bad things can still happen
    // if the user leaves one of the confirms open and adds/deletes, since the
    // prefs will no longer match the groupboxes
    if (groupbox.parentNode)
    {
      var vbox = document.getElementById('usergroups');
      vbox.removeChild(groupbox);
      var groups = vbox.getElementsByTagName('groupbox');
      for (var i = parseInt(id); i < groups.length; i++)
      {
        groups[i].id = 'ug-' + i;
        groups[i].getElementsByTagName('caption')[0].setAttribute('label', 'Group #' + (i + 1));
      }
    }
  },

  showPost: function(event)
  {
    event.preventDefault();

    var button = event.target;
    var doc = button.ownerDocument;
    var buttonContainer = button.offsetParent; // td
    var postMsg;

    if (GFutils.getMsgDataDisplay(doc)) // left of message
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
        postMsg.style.setProperty('font-size', '0pt', 'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.textContent = '[Show]';
      }
    }
    else // above message
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
        postMsg.style.setProperty('font-size', '0pt', 'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.textContent = '[Show]';
      }
    }
  },

  fillMenu: function(event)
  {
    var node = event.target;
    var list = document.getElementById('gamefox-context-usergroups-list');

    while (list.hasChildNodes())
      list.removeChild(list.childNodes[0]);

    // get the username of the target, return if it's not valid
    if (node.nodeName != 'A') return;
    if (node.href.indexOf('user.php') == -1) return;
    var username = node.textContent;

    this.loadGroups();
    var activeGroups = this.searchUsername(username)[4];
    if (!activeGroups) activeGroups = {};

    var groups = eval(this.prefs.getCharPref('userlist.serialized'));
    if (!groups.length)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', 'No groups');
      item.setAttribute('disabled', 'true');
      list.appendChild(item);
      return;
    }

    var item;
    for (var i = 0; i < groups.length; i++)
    {
      item = document.createElement('menuitem');
      item.setAttribute('type', 'checkbox');
      item.setAttribute('oncommand', 'GFuserlist.menuCheckChange(event, "' + username + '", this.value);');
      if (activeGroups[i] != undefined)
        item.setAttribute('checked', 'true');

      if (groups[i]['name'].length)
        item.setAttribute('label', groups[i]['name']);
      else
        item.setAttribute('label', 'Group #' + (i + 1));
      
      item.setAttribute('value', i);
      list.appendChild(item);
    }
  },

  menuCheckChange: function(event, username, group)
  {
    var groups = eval(this.prefs.getCharPref('userlist.serialized'));
    
    if (event.target.getAttribute('checked')) // add to group
    {
      if (GFutils.trim(groups[group]['users']).length)
        groups[group]['users'] += ", " + username;
      else
        groups[group]['users'] = username;
    }
    else // remove from group
    {
      groups[group]['users'] = groups[group]['users'].replace
        (new RegExp(',?\\s*' + username, 'g'), '');
    }

    this.prefs.setCharPref('userlist.serialized', groups.toSource());
  }
};
