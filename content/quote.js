/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Andrianto Effendy, Michael Ryan
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

var GFquote =
{
  quote: function(event, context)
  {
    var doc = event.target.ownerDocument;
    if (!doc.getElementById('gamefox-message'))
      return;

    var msgComponents = GFutils.getMsgComponents(event.target, doc);
    if (!msgComponents)
      return;

    var quoteMsg = msgComponents.body.innerHTML;
    var quoteHead = msgComponents.header.textContent;
    var msgNum = '#' + msgComponents.header.id.substr(1);

    // selection quoting
    var parentWin = new XPCNativeWrapper(document.commandDispatcher.focusedWindow,
        'document', 'getSelection()');
    var selection = parentWin.getSelection();
    // only use the selection if it's inside the clicked message and this
    // function is called from the context menu
    if (context && /\S/.test(selection.toString()) &&
        selection.containsNode(msgComponents.body, true))
    {
      quoteMsg = GFutils.specialCharsEncode(selection.toString());
    }

    GFquote.format(event, quoteHead, quoteMsg, msgNum);
  },

  format: function(event, quoteHead, quoteMsg, msgNum)
  {
    var doc = event.target.ownerDocument;

    /* Parse message header */
    var head = quoteHead.replace(/\|/g, '').split(/\xA0|\n/);
    for (var i = 0; i < head.length; i++)
      head[i] = head[i].GFtrim();
    var username = head[1];
    var postdate = head[head.length - 3].replace('Posted ', '');
    var postnum = msgNum;

    /* Parse message body */
    var body = quoteMsg.
      replace(/<br\s*\/?>/gi, '\n').
      replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/gi, '$1').
      replace(/<\/?(img|a|font|span|div|table|tbody|th|tr|td|wbr|u)\b[^<>]*\/?>/gi, '').
      GFtrim();

    // Get rid of signature
    if (GameFOX.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/---(\n.*\n?){0,2}$/, '');

    // Break escaped tags
    body = body.
      replace(/&lt;(\/?)(b|i|em|strong|br|p)&gt;/gi, '&lt;$1$2<b></b>&gt;').
      replace(/&lt;(br|p) \/&gt;/gi, '&lt;$1 /<b></b>&gt;');

    // Remove nested quotes
    bodyDOM = doc.createElement('td');
    bodyDOM.innerHTML = body;

    var quotes = doc.evaluate('./i/p', bodyDOM, null, XPathResult.
        ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < quotes.snapshotLength; i++)
      quotes.snapshotItem(i).parentNode.replaceChild(
          doc.createTextNode('[quoted text]'), quotes.snapshotItem(i));

    body = GFutils.specialCharsDecode(bodyDOM.innerHTML.GFtrim());

    /* Prepare quote header */
    var qhead = '';
    if (GameFOX.prefs.getBoolPref('quote.header.username')) qhead += 'From: ' + username;
    if (GameFOX.prefs.getBoolPref('quote.header.date')) qhead += ' | Posted: ' + postdate;
    if (GameFOX.prefs.getBoolPref('quote.header.messagenum')) qhead += ' | ' + postnum;

    if (qhead.length && GameFOX.prefs.getCharPref('quote.style') == 'normal')
    {
      if (GameFOX.prefs.getBoolPref('quote.header.italic')) qhead = '<i>' + qhead + '</i>';
      if (GameFOX.prefs.getBoolPref('quote.header.bold')) qhead = '<b>' + qhead + '</b>';
      qhead += '\n';
    }

    var qbody, quote;
    switch (GameFOX.prefs.getCharPref('quote.style'))
    {
      case 'normal':
        qbody = body;
        if (GameFOX.prefs.getBoolPref('quote.message.italic')) qbody = '<i>' + qbody + '</i>';
        if (GameFOX.prefs.getBoolPref('quote.message.bold')) qbody = '<b>' + qbody + '</b>';

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
    var sigStart = quickpost.value.search(/---(\n.*\n?){0,2}$/);

    if (sigStart != -1 && quickpost.selectionStart > sigStart) // insert at beginning
    {
      quickpost.value = quote + '\n' + quickpost.value;
      var endPosition = quote + 1;
    }
    else // insert at cursor
    {
      var endPosition = quickpost.selectionStart + quote.length + 1;
      quickpost.value = quickpost.value.substring(0, quickpost.selectionStart)
        + quote + '\n'
        + quickpost.value.substring(quickpost.selectionEnd, quickpost.value.length);
    }

    // update the character count
    if (GameFOX.prefs.getBoolPref('elements.charcounts'))
      GFmessages.updateMessageCount(doc);

    quickpost.focus();
    // Move the caret to the end of the last quote
    quickpost.setSelectionRange(endPosition, endPosition);
  }
};
