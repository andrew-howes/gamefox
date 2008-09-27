/* vim: set et sw=2 sts=2 ts=2: */

var GFquote =
{
  quote: function(event, context)
  {
    var doc = event.target.ownerDocument;
    if (!doc.getElementById('gamefox-message'))
      return;

    // TODO: review this for gfaqs9 cruft
    var node           = event.target;
    var nodeName       = node.nodeName.toLowerCase();
    var nodeClass      = node.className.toLowerCase();
    var tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
    var tableNodeName  = tableNode.nodeName.toLowerCase();
    var tableNodeClass = tableNode.className.toLowerCase();
    try
    {
      while (tableNodeName != 'table' || tableNodeClass != 'message')
      {
        node           = tableNode;
        nodeName       = tableNodeName;
        nodeClass      = tableNodeClass;
        tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
        tableNodeName  = tableNode.nodeName.toLowerCase();
        tableNodeClass = tableNode.className.toLowerCase();
      }
    }
    catch (e) { return; }

    var leftMsgData = GFutils.getMsgDataDisplay(doc);

    var quoteHead, quoteMsg, msgNum, headNode, msgNode;
    if ((!leftMsgData && node.parentNode.className != 'even') || nodeClass.indexOf('author') != -1)
    {
      // in message header
      headNode = node;

      if (!leftMsgData)
        msgNode = tableNode.rows[node.parentNode.rowIndex + 1].cells[0];
      else
        msgNode = node.parentNode.cells[1];
    }
    else
    {
      // in message body
      msgNode = node;

      if (!leftMsgData)
        headNode = tableNode.rows[node.parentNode.rowIndex - 1].cells[0];
      else
        headNode = node.parentNode.cells[0];
    }
    quoteMsg = msgNode.innerHTML;
    quoteHead = headNode.textContent;
    msgNum = '#' + headNode.id.substr(1);

    // selection quoting
    var parentWin = new XPCNativeWrapper(document.commandDispatcher.focusedWindow,
        'document', 'getSelection()');
    var selection = parentWin.getSelection();
    // only use the selection if it's inside the clicked message and this
    // function is called from the context menu
    if (context && /\S/.test(selection.toString()) &&
        selection.containsNode(msgNode, true))
    {
      quoteMsg = selection.toString();
    }

    GFquote.format(event, quoteHead, quoteMsg, msgNum);
  },

  format: function(event, quoteHead, quoteMsg, msgNum)
  {
    var doc = event.target.ownerDocument;

    /* Parse message header */
    var head = quoteHead.replace(/\|/g, '').split(/\xA0|\n/);
    for (var i = 0; i < head.length; i++)
      head[i] = GFutils.trim(head[i]);
    var username = head[1];
    var postdate = head[head.length - 3].replace('Posted ', '');
    var postnum = msgNum;

    /* Parse message body */
    var body = GFutils.trim(quoteMsg.
      replace(/<br\s*\/?>/gi, '\n').
      replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/gi, '$1').
      replace(/<\/?(img|a|font|span|div|table|tbody|th|tr|td|wbr|u)\b[^<>]*\/?>/gi, ''));

    // Get rid of signature
    if (GameFOX.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/---(\n.*\n?){0,2}$/, ''); // Only a simple regexp is needed because extraneous
                                                     // signatures are no longer allowed
    body = GFutils.specialCharsDecode(GFutils.trim(body));
    // Prevent too much GFCode quote nesting
    var loops = 0;
    while (body.match(/(<i><p>[\s\S]*?){3,}/) != null)
    { // the number at the end of the regexp (e.g., {3,}) is max number of recursive quotes
      if (loops > 6) // too many nests from when this wasn't enforced, just give up
                     // and quote the last guy
      {
        body = body.replace(/\n*<i><p>[\s\S]*<\/p><\/i>\n*/, '');
        break;
      }
      body = body.replace(/\n*<i><p>(?:(?=([^<]+))\1|<(?!i>))*?<\/p><\/i>\n*/, '\n');
      loops++;
    }

    /* Prepare quote header */
    var qhead = '';
    if (GameFOX.prefs.getBoolPref('quote.header.username')) qhead += username;
    if (GameFOX.prefs.getBoolPref('quote.header.date')) qhead += ' | Posted ' + postdate;
    if (GameFOX.prefs.getBoolPref('quote.header.messagenum') && postnum) qhead += ' (' + postnum + ')';

    if (qhead.length && GameFOX.prefs.getCharPref('quote.style') != 'gfcode')
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

        quote = qhead + qbody;
        break;
      case 'gfcode':
        if (qhead.length)
          qhead = '<i><p><strong>' + qhead + '</strong>\n';
        else // no header
          qhead = '<i><p>';

        quote = qhead + body + '</p></i>';
        break;
      case 'custom':
        var quoteTemplate = GFutils.getString('quote.style.custom');
        var quote = quoteTemplate.
          replace(/\%u/g, username).
          replace(/\%d/g, postdate).
          replace(/\%n/g, postnum).
          replace(/\%m/g, body);
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
