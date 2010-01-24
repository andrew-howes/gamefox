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

var gamefox_highlighting =
{
  highlightClassName: 'gamefox-highlight',
  groupClassName: 'gamefox-groupname',

  add: function(name, color, users, messages, topics, type)
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized'));

    name = (typeof name == 'string') ? name : '';
    color = (typeof color == 'string') ? color : '#CCFFFF';
    users = (typeof users == 'string') ? users : '';
    messages = (typeof messages == 'string') ? messages : 'highlight';
    topics = (typeof topics == 'string') ? topics : 'highlight';
    type = (typeof type == 'string') ? type : 'users';

    userlist.push({name:name, color:color, users:users,
        messages:messages, topics:topics, type:type});

    gamefox_lib.setString('userlist.serialized', gamefox_lib.toJSON(userlist));
  },

  loadGroups: function()
  {
    var values, value, type;
    var userlist = gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized'));
    this.index = {users:{}, titleContains:{}, postContains:{}};

    // build the index
    for (var i = 0; i < userlist.length; i++)
    {
      type = userlist[i].type;
      values = userlist[i].users.gamefox_trim().toLowerCase()
        .split(/\s*,\s*/);
      for (var j = 0; j < values.length; j++)
      {
        value = values[j];
        if (!value.length) continue;

        if (type == 'users')
        {
          if (this.index[type][value])
          {
            // don't add the same group twice, if the value is listed multiple times
            if (this.index[type][value].indexOf(i) == -1)
              this.index[type][value].push(i);
          }
          else
            this.index[type][value] = [i];
        }
        else // type == titleContains|postContains
        {
          // the index for titleContains/postContains maps groups to values
          if (this.index[type][i])
            this.index[type][i].push(value);
          else
            this.index[type][i] = [value];
        }
      }
    }

    // recent value of userlist.serialized
    return userlist;
  },

  searchPost: function(username, post, tc, providedUserlist)
  {
    if (!this.index) return false;
    var index = this.index.postContains;

    post = post.toLowerCase();

    var groups = [];
    for (var i in index)
    {
      for (var j = 0; j < index[i].length; j++)
      {
        if (post.indexOf(index[i][j]) != -1)
          groups.push(i);
          break;
      }
    }

    if (!groups[0])
    {
      // nothing in postContains index, return users index instead
      return this.searchUsername(username, tc, providedUserlist);
    }

    var userlist = providedUserlist == null ? gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized')) : providedUserlist;

    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]].name.length)
        groupNames += userlist[groups[i]].name + ', ';

    // Get group names from username search
    var hlinfo = this.searchUsername(username, tc, userlist);
    if (hlinfo && hlinfo[0].length)
      groupNames += hlinfo[0] + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages,
           topics, groups];
  },

  searchTopic: function(username, title, providedUserlist)
  {
    if (!this.index) return false;
    var index = this.index.titleContains;

    title = title.toLowerCase();

    var groups = [];
    for (var i in index)
    {
      for (var j = 0; j < index[i].length; j++)
      {
        if (title.indexOf(index[i][j]) != -1)
          groups.push(i);
          break;
      }
    }

    if (!groups[0])
    {
      // nothing in titleContains index, return users index instead
      return this.searchUsername(username, false, providedUserlist);
    }

    var userlist = providedUserlist == null ? gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized')) : providedUserlist;

    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]].name.length)
        groupNames += userlist[groups[i]].name + ', ';

    // Get group names from username search
    var hlinfo = this.searchUsername(username, false, userlist);
    if (hlinfo && hlinfo[0].length)
      groupNames += hlinfo[0] + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages,
           topics, groups];
  },

  searchUsername: function(username, tc, providedUserlist)
  {
    if (!this.index) return false;
    var index = this.index.users;

    username = username.gamefox_trim().toLowerCase();
    if (!username.length) return false;

    if (!index[username] && !(tc && index['(tc)']))
      return false; // username isn't in any groups

    var userlist = providedUserlist == null ? gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized')) : providedUserlist;
    if (tc && index[username] && index['(tc)'])
      var groups = gamefox_utils.mergeArray(index[username], index['(tc)']);
    else if (tc && index['(tc)'])
      var groups = index['(tc)'];
    else
      var groups = index[username];

    // first group decides everything
    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    // list of all groups where the user is present
    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]].name.length)
        groupNames += userlist[groups[i]].name + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages,
           topics, groups];
  },

  showPost: function(event)
  {
    event.preventDefault();

    var button = event.target;
    var doc = button.ownerDocument;
    var buttonContainer = button.offsetParent; // td
    var postMsg;

    // TODO: do we need to do this font-size stuff?
    if (gamefox_utils.getMsgDataDisplay(doc)) // left of message
    {
      postMsg = buttonContainer.parentNode.cells[1];
      if (postMsg.style.fontSize == '0pt')
      {
        postMsg.style.removeProperty('font-size');
        postMsg.removeAttribute('style');
        buttonContainer.style.removeProperty('font-size');
        button.title = 'Hide';
        button.className = 'gamefox-hide-post-link';
        button.textContent = 'hide';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt', 'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.title = 'Show';
        button.className = 'gamefox-show-post-link';
        button.textContent = 'show';
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
        button.title = 'Hide';
        button.className = 'gamefox-hide-post-link';
        button.textContent = 'hide';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt', 'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.title = 'Show';
        button.className = 'gamefox-show-post-link';
        button.textContent = 'show';
      }
    }
  },

  menuCheckChange: function(event, username, group)
  {
    var userlist = gamefox_lib.safeEval(gamefox_lib.getString('userlist.serialized'));

    if (event.target.getAttribute('checked')) // add to group
    {
      if (/\S/.test(userlist[group].users))
        userlist[group].users += ', ' + username;
      else
        userlist[group].users = username;
    }
    else // remove from group
    {
      userlist[group].users = userlist[group].users.replace
        (new RegExp('(,\\s*' + username + '\\s*$|' +
                      '^\\s*' + username + '\\s*,\\s*|' +
                      '^\\s*' + username + '\\s*$)', 'gi'), '');
      userlist[group].users = userlist[group].users.replace
        (new RegExp(',\\s*' + username + '\\s*,', 'gi'), ',');
    }

    gamefox_lib.setString('userlist.serialized', gamefox_lib.toJSON(userlist));
  },

  checkUsername: function(username)
  {
    return this.index.users[username] != null;
  }
};
