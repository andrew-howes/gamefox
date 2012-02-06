/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2011 Brian Marshall, Michael Ryan
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

var gamefox_sigs =
{
  _read: function()
  {
    return JSON.parse(gamefox_lib.getString('signature.serialized'));
  },
  _save: function(sigs)
  {
    gamefox_lib.setString('signature.serialized', JSON.stringify(sigs));
  },

  _search: function(account, boardName, boardId)
  {
    // Sanitize
    account = account.toLowerCase();
    boardId = parseInt(boardId);
    boardName = boardName.toLowerCase();

    // Search results, grouped by specificity
    var matches = [
      [], // priority 0
      [], // priority 1
      []  // priority 2
    ];

    var sigs = this._read();

    // Check if the sigs array is valid
    if (!sigs || !sigs[0])
      return '';

    // Find matching sigs
    var boards, accounts;
    for (var i = 0; i < sigs.length; i++)
    {
      if (!sigs[i].body.length) continue; // skip empty

      accounts = this._splitByCommas(sigs[i].accounts);
      boards = this._splitByCommas(sigs[i].boards);

      // Account and board (P0)
      if (accounts.length && boards.length && accounts.indexOf(account) != -1
          && this._matchBoard(boards, boardId, boardName))
        matches[0].push(sigs[i]);

      // Account only (P1)
      else if (accounts.length && !boards.length && accounts.indexOf(account)
          != -1)
        matches[1].push(sigs[i]);

      // Board only (P1)
      else if (boards.length && !accounts.length && this._matchBoard(boards,
          boardId, boardName))
        matches[1].push(sigs[i]);

      // Global/default (P2)
      else if (!accounts.length && !boards.length)
        matches[2].push(sigs[i]);
    }

    // Select the best matching array
    var list;
    if (gamefox_lib.prefs.getBoolPref('signature.selectMostSpecific'))
      list = matches[matches[0].length ? 0 : matches[1].length ? 1 : 2];
    else
      list = gamefox_utils.mergeArrays(matches[0], matches[1], matches[2]);

    // Return a random sig
    var sig = list[Math.floor(Math.random() * list.length)];
    return sig ? this.clean(sig.body) : '';
  },

  _splitByCommas: function(str)
  {
    var list = str.toLowerCase().trim().split(/\s*,\s*/);
    if (list.join() == '')
      list = [];

    return list;
  },

  _matchBoard: function(boards, boardId, boardName)
  {
    if ((boardId && boards.indexOf(boardId.toString()) != -1) ||
        (boardName && boards.indexOf(boardName) != -1))
      return true;

    return false;
  },

  newSig: function()
  {
    var sigs = this._read();
    sigs.push({'accounts': '', 'boards': '', 'body': ''});
    this._save(sigs);

    return sigs.length - 1;
  },

  deleteSig: function(id)
  {
    var sigs = this._read();
    sigs.splice(id, 1);
    this._save(sigs);
  },

  clean: function(sig)
  {
    // Max of 2 lines
    sig = sig.split('\n');
    if (sig.length >= 2)
      sig = sig[0] + '\n' + sig[1];
    else
      sig = sig[0];

    // Remove <p>
    sig = sig.replace(/<\/?p>/g, '');

    // Max of 160 characters (with expanded HTML entities)
    sig = gamefox_utils.specialCharsEncode(sig).substr(0, 160);

    // Remove any partial HTML entities from the substr
    var amp = sig.lastIndexOf('&');
    if (sig.lastIndexOf(';') < amp)
      sig = sig.substr(0, amp);

    return gamefox_utils.specialCharsDecode(sig);
  },

  select: function(doc)
  {
    return this._search(gamefox_utils.getAccountName(doc), gamefox_utils
        .getBoardName(doc), gamefox_utils.getBoardId(doc.location.pathname));
  }
};
