/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012
 * Brian Marshall, Michael Ryan, Andrianto Effendy
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
  extraTypes: ['admins', 'mods', 'vips', 'tc'],

  read: function()
  {
    return gamefox_lib.parseJSON(gamefox_lib.getString('userlist.serialized'))
      || [];
  },

  write: function(groups)
  {
    gamefox_lib.setString('userlist.serialized', JSON.stringify(groups));
  },

  add: function()
  {
    var groups = this.read();
    groups.push({'name': '', 'color': '#CCFFFF', 'users': '', 'messages':
      'highlight', 'topics': 'highlight', 'type': 'users', 'include': []});
    this.write(groups);
  },

  loadGroups: function()
  {
    var values, value, type, included;
    var userlist = this.read();
    this.index = {users:{}, titleContains:{}, postContains:{}, status: {}};
    for (var i = 0; i < gamefox_highlighting.extraTypes.length; i++)
      this.index.status[gamefox_highlighting.extraTypes[i]] = [];

    // build the index
    for (var i = 0; i < userlist.length; i++)
    {
      type = userlist[i].type;
      values = userlist[i].users.trim().toLowerCase().split(/\s*[,\n]\s*/m);
      included = userlist[i].include;
      for (var j = 0; j < values.length; j++)
      {
        value = values[j];
        if (!value.length) continue;

        if (type == 'users')
        {
          if (this.index[type].hasOwnProperty(value))
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

      for (var j = 0; j < included.length; j++) {
        if (this.index.status.hasOwnProperty(included[j]))
          this.index.status[included[j]].push(i);
      }
    }

    // recent value of userlist.serialized
    return userlist;
  },

  // TODO: Consolidate the search functions? Lots of duplicated code

  searchPost: function(username, post, status, providedUserlist)
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
        {
          groups.push(i);
          break;
        }
      }
    }

    if (!groups[0])
    {
      // nothing in postContains index, return users index instead
      return this.searchUsername(username, status, providedUserlist);
    }

    var userlist = providedUserlist == null ? this.read() : providedUserlist;

    // also get groups from username search
    var hlinfo = this.searchUsername(username, status, userlist);
    if (hlinfo && hlinfo[4])
      groups = gamefox_utils.mergeSortArrays(groups, hlinfo[4]);

    // first group decides everything
    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]].name.length)
        groupNames += userlist[groups[i]].name + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages,
           topics, groups];
  },

  searchTopic: function(username, topicId, title, status, providedUserlist)
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
        {
          groups.push(i);
          break;
        }
      }
    }

    if (!groups[0])
    {
      // nothing in titleContains index, return users index instead
      return this.searchUsername(username, status, providedUserlist);
    }

    var userlist = providedUserlist == null ? this.read() : providedUserlist;

    // also get groups from username search
    var hlinfo = this.searchUsername(username, status, userlist);
    if (hlinfo && hlinfo[4])
      groups = gamefox_utils.mergeSortArrays(groups, hlinfo[4]);

    // first group decides everything
    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    var groupNames = '';
    for (var i = 0; i < groups.length; i++)
      if (userlist[groups[i]].name.length)
        groupNames += userlist[groups[i]].name + ', ';

    return [groupNames.substr(0, groupNames.length - 2), color, messages,
           topics, groups];
  },

  searchUsername: function(username, status, providedUserlist)
  {
    if (!this.index) return false;
    var index = this.index.users;

    username = username.trim().toLowerCase();
    if (!username.length) return false;

    if (!index.hasOwnProperty(username))
      return this.searchStatus(status); // username isn't in any groups

    var userlist = providedUserlist == null ? this.read() : providedUserlist;
    var groups = index[username];

    if (status)
    {
      var statusGroups = this.searchStatus(status);
      if (statusGroups)
        groups = gamefox_utils.mergeSortArrays(statusGroups[4], groups)
    }

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

  searchStatus: function(status, providedUserlist)
  {
    if (!status || !this.index) return false;
    var index = this.index.status;

    var userlist = providedUserlist == null ? this.read() : providedUserlist;
    var groups = [];

    for (var i = 0; i < status.length; i++)
      groups = gamefox_utils.mergeSortArrays(index[status[i]], groups);

    if (!groups || !groups.length) return false;

    // first group decides everything
    var color = userlist[groups[0]].color;
    var messages = userlist[groups[0]].messages;
    var topics = userlist[groups[0]].topics;

    // list group names
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
    var userlist = this.read();

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

    this.write(userlist);
  },

  checkUsername: function(username)
  {
    return this.index.users[username] != null;
  }
};
