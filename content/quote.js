/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011
 * Brian Marshall, Andrianto Effendy, Michael Ryan
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

    // If an older version of the post is loaded, switch back to the latest
    // before quoting
    gamefox_messages.loadLatestEdit(msgComponents);

    var quoteMsg = msgComponents.body.getUserData('gamefox_editing') === true ?
      msgComponents.body.getUserData('gamefox_originalPost') :
      msgComponents.body.innerHTML;
    var postUser, postDate, postNum;

    // postUser
    postUser = msgComponents.header.querySelector('a.name');
    postUser = postUser ? postUser.textContent : '???';

    // postDate
    postDate = msgComponents.header.getUserData('gamefox_date');

    // postNum
    postNum = '000'.substring(msgComponents.id.toString().length) +
      msgComponents.id;

    // selection quoting
    var selection = document.commandDispatcher.focusedWindow.getSelection();
    // only use the selection if it's inside the clicked message and this
    // function is not triggered by a double-click
    if (allowSelection && /\S/.test(selection.toString()) &&
        selection.containsNode(msgComponents.body, true))
    {
      quoteMsg = gamefox_utils.convertNewlines(gamefox_utils
          .specialCharsEncode(selection.toString()));
    }

    gamefox_quote.format(event, quoteMsg, postUser, postDate, postNum);
  },

  format: function(event, quoteMsg, postUser, postDate, postNum)
  {
    var doc = event.target.ownerDocument;
    var textarea = doc.gamefox.lastFocusedPostForm.elements
      .namedItem('messagetext');

    /* Parse message body */
    var body = quoteMsg.
      replace(/<br\s*\/?>/gi, '\n').
      replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/gi, '$1').
      replace(/<\/?(img|a|font|span|div|table|tbody|th|tr|td|wbr|u|embed)\b[^<>]*\/?>/gi,
        '').trim();

    // Get rid of signature
    if (gamefox_lib.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/(^|\n) *--- *(\n.*){0,2}$/, '');

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

    body = gamefox_utils.specialCharsDecode(bodyDOM.innerHTML.trim());

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

    // If the header is already in the message, don't repeat it
    // Useful for quoting multiple selections
    if (textarea.value.indexOf(qhead) != -1)
      qhead = '';

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

    var endPos;
    if (textarea.form.className == 'gamefox-edit' &&
        textarea.selectionStart > textarea.value.search(/---(\n.*){0,2}$/))
    {
      // Insert at beginning (because the cursor is in the sig area)
      textarea.value = quote + '\n' + textarea.value;
      endPos = quote.length + 1;
    }
    else
    {
      // Insert at cursor position
      endPos = textarea.selectionStart + quote.length + 1;
      textarea.value = textarea.value.substr(0, textarea.selectionStart) +
        quote + '\n' + textarea.value.substr(textarea.selectionEnd);
    }

    // update the character count
    gamefox_messages.updateMessageCount(textarea);

    if (gamefox_lib.prefs.getBoolPref('quote.focusQuickPost'))
      textarea.focus();
    else
      event.target.blur();

    // Move the caret to the end of the last quote
    textarea.setSelectionRange(endPos, endPos);
  }
};
