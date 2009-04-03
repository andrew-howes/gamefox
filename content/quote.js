/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Andrianto Effendy, Michael Ryan
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

var gamefox_quote =
{
  quote: function(event, allowSelection)
  {
    var doc = event.target.ownerDocument;
    if (!doc.getElementById('gamefox-message'))
      return;

    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    if (!msgComponents)
      return;

    var quoteMsg = msgComponents.body.innerHTML;
    var postUser, postDate, postNum;

    // postUser
    postUser = msgComponents.header.getElementsByTagName('a')[0];
    postUser = postUser ? postUser.textContent : '???';

    // postDate
    var node;
    for (var i = 0; i < msgComponents.header.childNodes.length; i++)
    {
      node = msgComponents.header.childNodes[i];
      if (node.nodeName == '#text')
      {
        postDate = /\|\s+Posted\s([^\|]+)\s\|/.exec(node.textContent);
        if (postDate)
          break;
      }
    }
    postDate = postDate ? postDate[1].gamefox_trim() : '???';

    // postNum
    postNum = msgComponents.header.id.substr(1);

    // selection quoting
    var selection = document.commandDispatcher.focusedWindow.getSelection();
    // only use the selection if it's inside the clicked message and this
    // function is not triggered by a double-click
    if (allowSelection && /\S/.test(selection.toString()) &&
        selection.containsNode(msgComponents.body, true))
    {
      quoteMsg = gamefox_utils.convertNewlines(gamefox_utils.specialCharsEncode(selection.toString()));
    }

    gamefox_quote.format(event, quoteMsg, postUser, postDate, postNum);
  },

  format: function(event, quoteMsg, postUser, postDate, postNum)
  {
    var doc = event.target.ownerDocument;

    /* Parse message body */
    var body = quoteMsg.
      replace(/<br\s*\/?>/gi, '\n').
      replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/gi, '$1').
      replace(/<\/?(img|a|font|span|div|table|tbody|th|tr|td|wbr|u|embed)\b[^<>]*\/?>/gi, '').
      gamefox_trim();

    // Get rid of signature
    if (gamefox_lib.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/---(\n.*){0,2}$/, '');

    // Break escaped tags
    body = gamefox_utils.breakTags(body);

    bodyDOM = doc.createElement('td');
    bodyDOM.innerHTML = body;

    // Remove nested quotes
    var quotes = doc.evaluate('i/p', bodyDOM, null, XPathResult.
        ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < quotes.snapshotLength; i++)
    {
      if (quotes.snapshotLength == 1 && quotes.snapshotItem(i).parentNode
          .previousSibling == null)
        bodyDOM.removeChild(quotes.snapshotItem(i).parentNode);
      else
      {
         bodyDOM.insertBefore(doc.createTextNode('\n'),
             quotes.snapshotItem(i).parentNode.nextSibling);
         quotes.snapshotItem(i).parentNode.replaceChild(
             doc.createTextNode('[quoted text]'), quotes.snapshotItem(i));
      }
    }

    // Remove p tags which break GFCode
    var p = doc.evaluate('p', bodyDOM, null, XPathResult.
        ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < p.snapshotLength; i++)
    {
      bodyDOM.insertBefore(doc.createTextNode('\n' + p.snapshotItem(i).textContent),
          p.snapshotItem(i));
      bodyDOM.removeChild(p.snapshotItem(i));
    }

    body = gamefox_utils.specialCharsDecode(bodyDOM.innerHTML.gamefox_trim());

    /* Prepare quote header */
    var qhead = '';
    if (gamefox_lib.prefs.getBoolPref('quote.header.username'))
      qhead += 'From: ' + postUser;
    if (gamefox_lib.prefs.getBoolPref('quote.header.date'))
      qhead += (qhead.length ? ' | ' : '') + 'Posted: ' + postDate;
    if (gamefox_lib.prefs.getBoolPref('quote.header.messagenum'))
      qhead += (qhead.length ? ' | ' : '') + '#' + postNum;

    if (qhead.length && gamefox_lib.prefs.getCharPref('quote.style') == 'normal')
    {
      if (gamefox_lib.prefs.getBoolPref('quote.header.italic')) qhead = '<i>' + qhead + '</i>';
      if (gamefox_lib.prefs.getBoolPref('quote.header.bold')) qhead = '<b>' + qhead + '</b>';
      qhead += '\n';
    }

    var qbody, quote;
    switch (gamefox_lib.prefs.getCharPref('quote.style'))
    {
      case 'normal':
        qbody = body;
        if (gamefox_lib.prefs.getBoolPref('quote.message.italic')) qbody = '<i>' + qbody + '</i>';
        if (gamefox_lib.prefs.getBoolPref('quote.message.bold')) qbody = '<b>' + qbody + '</b>';

        quote = qhead + qbody + '\n';
        break;

      default: // gfcode
        if (qhead.length)
          qhead = '<i><p><strong>' + qhead + '</strong>\n';
        else // no header
          qhead = '<i><p>';

        quote = qhead + body + '</p></i>';
        break;
    }
    var quickpost = doc.getElementById('gamefox-message');

    // try to insert at the cursor position, but only if the cursor isn't in
    // a stupid place like after the signature separator
    var sigStart = quickpost.value.search(/---(\n.*){0,2}$/);

    if (sigStart != -1 && quickpost.selectionStart > sigStart) // insert at beginning
    {
      quickpost.value = quote + '\n' + quickpost.value;
      var endPosition = quote.length + 1;
    }
    else // insert at cursor
    {
      var endPosition = quickpost.selectionStart + quote.length + 1;
      quickpost.value = quickpost.value.substr(0, quickpost.selectionStart)
        + quote + '\n' + quickpost.value.substr(quickpost.selectionEnd);
    }

    // update the character count
    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(doc);

    quickpost.focus();
    // Move the caret to the end of the last quote
    quickpost.setSelectionRange(endPosition, endPosition);
  }
};
