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

var gamefox_sig =
{
  getSigByCriteria: function(account, boardname, boardid)
  {
    account = account.toLowerCase();
    boardname = boardname.toLowerCase();
    var matches = new Array(new Array(), new Array(), new Array());
    var accounts, boards;
    var sigs = gamefox_lib.safeEval(gamefox_lib.getString('signature.serialized'));

    // check if sigs array is valid
    if (!sigs || !sigs[0])
      return {boards: '', accounts: '', body: ''};

    // find matching sigs
    for (var i = 1; i < sigs.length; i++)
    {
      // skip empty sigs
      if (!sigs[i]['body'].length) continue;

      accounts = sigs[i]['accounts'].toLowerCase().trim().split(/\s*,\s*/);
      boards = sigs[i]['boards'].toLowerCase().trim().split(/\s*,\s*/);

      // force the array length to 0
      if (accounts.join() == '') accounts = new Array();
      if (boards.join() == '') boards = new Array();

      if (!accounts.length && boards.length)
      {
        if (this.matchBoard(boards, boardid, boardname))
          matches[1].push(sigs[i]);
      }
      else if (accounts.length && !boards.length)
      {
        if (accounts.indexOf(account) != -1)
          matches[1].push(sigs[i]);
      }
      else if (accounts.length && boards.length)
      {
        if (accounts.indexOf(account) != -1
            && this.matchBoard(boards, boardid, boardname))
          matches[0].push(sigs[i]); // account and board-specific sig, highest priority
      }
      else
      {
        matches[2].push(sigs[i]); // global sig, lowest priority
      }
    }
    // default is the last of the lowest priority
    if (sigs[0]['body'].length)
      matches[2].push(sigs[0]);

    var sig;

    if (gamefox_lib.prefs.getBoolPref('signature.selectMostSpecific'))
    {
      var bestIndex = matches[0].length ? 0 : matches[1].length ? 1 : 2;
      sig = matches[bestIndex][Math.floor(Math.random() * matches[bestIndex].length)];
    }
    else
    {
      var allMatches = gamefox_utils.mergeArray(matches[0], matches[1], matches[2]);
      sig = allMatches[Math.floor(Math.random() * allMatches.length)];
    }

    // default is only sig and is empty
    if (sig == undefined)
      sig = sigs[0];

    return sig;
  },

  getSigById: function(id)
  {
    return gamefox_lib.safeEval(gamefox_lib.getString('signature.serialized'))[id];
  },

  addSig: function()
  {
    var sigs = gamefox_lib.safeEval(gamefox_lib.getString('signature.serialized'));
    sigs.push({'accounts':'', 'boards':'', 'body':''});
    gamefox_lib.setString('signature.serialized', gamefox_lib.toJSON(sigs));

    return sigs.length - 1;
  },

  deleteSigById: function(id)
  {
    var sigs = gamefox_lib.safeEval(gamefox_lib.getString('signature.serialized'));
    sigs.splice(id, 1);
    gamefox_lib.setString('signature.serialized', gamefox_lib.toJSON(sigs));
  },

  getCriteriaString: function(accounts, boards)
  {
    switch ((/\S/.test(accounts) ? 1 : 0) + (/\S/.test(boards) ? 2 : 0))
    {
      case 0: return 'Signature';
      case 1: return 'Accounts: ' + accounts;
      case 2: return 'Boards: ' + boards;
      case 3: return 'Accounts: ' + accounts + ' + Boards: ' + boards;
    }
  },

  matchBoard: function(boards, boardid, boardname)
  {
    if ((boardid && boards.indexOf(boardid) != -1)
        || (boardname && boards.indexOf(boardname) != -1))
      return true;
    return false;
  },

  format: function(sig, newline, doc)
  {
    if (sig == null) // fetch sig
    {
      if (!doc) return false;
      var boardname = gamefox_utils.getBoardName(doc);
      var boardid = gamefox_utils.getBoardId(doc.location.pathname);
      var account = gamefox_utils.getAccountName(doc);
      var getSig = gamefox_sig.getSigByCriteria(account, boardname, boardid);
      sig = getSig['body'];
    }
    if (!sig.length)
      return '';

    if (newline == null) // fetch newline
      newline = gamefox_lib.prefs.getBoolPref('signature.newline');

    // truncate at 2 lines
    sig = sig.split('\n');
    if (sig.length >= 2)
      sig = sig[0] + '\n' + sig[1];
    else
      sig = sig[0];

    // remove p
    sig = sig.replace(/<\/?p>/g, '');

    // truncate at 160 characters
    sig = gamefox_utils.specialCharsEncode(sig).substr(0, 160);

    // remove truncated entities
    var amp = sig.lastIndexOf('&');
    if (sig.lastIndexOf(';') < amp)
      sig = sig.substr(0, amp);

    return gamefox_utils.specialCharsDecode(sig);
  },

  formatSigPreview: function(str)
  {
    if (!/\S/.test(str))
      return '';

    return ' / ' + str.trim().replace(/\s+/g, ' ');
  }
};
