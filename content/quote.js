/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012
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

/**
 * Post quoting
 * @namespace
 */
var gamefox_quote =
{
  /**
   * Initiate quoting of a post
   *
   * @param {Object} event
   *        Event that triggered the quote
   * @param {Boolean} [allowSelection=false]
   *        Whether to make an excerpted quote using the selection (if any).
   *        This should be true when not triggered by a double click.
   * @return {void}
   */
  quote: function(event, allowSelection)
  {
    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    if (!msgComponents)
      return;

    // Get the message text from the innerHTML, originalPost user data (if an
    // edit form is active), or the selection
    var text;
    var selection = document.commandDispatcher.focusedWindow.getSelection();
    if (allowSelection && /\S/.test(selection.toString()) && selection
        .containsNode(msgComponents.body, true))
      text = gamefox_utils.convertNewlines(gamefox_utils
          .specialCharsEncode(selection.toString()));
    else if (msgComponents.body.getUserData('gamefox_editing') === true)
      text = msgComponents.body.getUserData('gamefox_originalPost');
    else
      text = msgComponents.body.innerHTML;

    // Get information for the quote header
    var user = msgComponents.header.querySelector('a.name').textContent;
    var date = msgComponents.header.getUserData('gamefox_date');
    var num = msgComponents.id;

    // Get the edit number (if any)
    // 0 = current, -1 = original, 1..n = edit number
    var editNum = 0;
    var editMenu = gamefox_messages.getEditMenu(msgComponents);
    if (editMenu && editMenu.selectedIndex > 0)
      editNum = editMenu.selectedIndex + 1 == editMenu.length ? -1
        : editMenu.length - editMenu.selectedIndex - 1;

    // Insert the quote
    var textarea = doc.gamefox.lastFocusedPostForm.elements.namedItem(
        'messagetext');
    var quote = gamefox_quote._format(textarea, text, user, date, num, editNum
        );
    gamefox_quote._insert(textarea, quote);
  },

  /**
   * Compile a quote using GFCode or classic tags
   *
   * @param {Object} textarea
   *        HTML textarea element that the quote will be added to
   * @param {String} text
   *        Text of the quoted post
   * @param {String} user
   *        Username of the quoted post author
   * @param {String} date
   *        Date of the quoted post
   * @param {Number} num
   *        Number of the quoted post
   * @param {Number} editNum
   *        Which revision of the post is being quoted. 0 = latest edit (or no
   *        edits), -1 = original version (before edits), 1..n = edit number.
   * @return {String} Complete quote text, with tags
   */
  _format: function(textarea, text, user, date, num, editNum)
  {
    var doc = gamefox_lib.getDocument(textarea);

    /* Quote header */
    var header = '';

    if (gamefox_lib.prefs.getBoolPref('quote.header.username'))
      header += ' | From: ' + user;

    if (gamefox_lib.prefs.getBoolPref('quote.header.date'))
      header += ' | Posted: ' + date;

    if (gamefox_lib.prefs.getBoolPref('quote.header.messagenum'))
      header += ' | #' + '000'.substring(num.toString().length) + num;

    if (header.length && editNum != 0)
      header += ' | Previous Revision - ' + (editNum == -1 ? 'Before Edits' :
          'Edit ' + editNum);

    header = header.substr(3);

    // Don't repeat headers already in the textbox (useful for quoting multiple
    // excerpts from the same post)
    if (textarea.value.indexOf(header) != -1)
      header = '';

    /* Quote body */
    var body = text.replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/gi, '$1')
      .replace(new RegExp('</?(img|a|font|span|div|table|tbody|th|tr|td|wbr|' +
              'u|embed)\\b[^<>]*/?>', 'gi'), '').trim();

    // Remove the signature
    if (gamefox_lib.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/(^|\n) *--- *(\n.*){0,2}$/, '');

    // Break escaped tags
    body = gamefox_utils.breakTags(body);

    var bodyDOM = doc.createElement('td');
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
      bodyDOM.insertBefore(doc.createTextNode('\n' + p.snapshotItem(i)
            .textContent), p.snapshotItem(i));
      bodyDOM.removeChild(p.snapshotItem(i));
    }

    body = gamefox_utils.specialCharsDecode(bodyDOM.innerHTML.trim());

    /* Compile the final quote */
    switch (gamefox_lib.prefs.getCharPref('quote.style'))
    {
      // Classic
      case 'normal':
        if (gamefox_lib.prefs.getBoolPref('quote.header.italic'))
          header = '<i>' + header + '</i>';
        if (gamefox_lib.prefs.getBoolPref('quote.header.bold'))
          header = '<b>' + header + '</b>';

        if (gamefox_lib.prefs.getBoolPref('quote.message.italic'))
          body = '<i>' + body + '</i>';
        if (gamefox_lib.prefs.getBoolPref('quote.message.bold'))
          body = '<b>' + body + '</b>';

        return header + '\n' + body + '\n';

      // Standard
      case 'std':
      default:
        return '<quote>' +
          (header.length ? '<b><b>' + header + '</b></b>\n' : '') +
          body + '</quote>';
    }
  },

  /**
   * Insert a quote into a textarea
   *
   * @param {Object} textarea
   *        HTML textarea element to insert into
   * @param {String} quote
   *        Quote text to insert
   * @return {void}
   */
  _insert: function(textarea, quote)
  {
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

    // Update the character count
    gamefox_messages.updateMessageCount(textarea);

    if (gamefox_lib.prefs.getBoolPref('quote.focusQuickPost'))
      textarea.focus();

    // Move the caret to the end of the last quote
    textarea.setSelectionRange(endPos, endPos);
  }
};
