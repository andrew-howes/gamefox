/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla code.
 *
 * The Initial Developer of the Original Code is
 * Simon Bünzli <zeniko@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2006-2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Utilities for JavaScript code to handle JSON content.
 * See http://www.json.org/ for comprehensive information about JSON.
 *
 * Import this module through
 *
 * Components.utils.import("resource://gre/modules/JSON.jsm");
 *
 * Usage:
 *
 * var newJSONString = JSON.toString( GIVEN_JAVASCRIPT_OBJECT );
 * var newJavaScriptObject = JSON.fromString( GIVEN_JSON_STRING );
 *
 * Note: For your own safety, Objects/Arrays returned by
 *       JSON.fromString aren't instanceof Object/Array.
 */

// The following code is a loose adaption of Douglas Crockford's code
// from http://www.json.org/json.js (public domain'd)

// Notable differences:
// * Unserializable values such as |undefined| or functions aren't
//   silently dropped but always lead to a TypeError.
// * An optional key blacklist has been added to JSON.toString

var gamefox_json = {
  /**
   * Checks whether the given string contains potentially harmful
   * content which might be executed during its evaluation
   * (no parser, thus not 100% safe! Best to use a Sandbox for evaluation)
   *
   * @param aString is the string to be tested
   * @return a boolean
   */
  isMostlyHarmless: function JSON_isMostlyHarmless(aString) {
    const maybeHarmful = /[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/;
    const jsonStrings = /"(\\.|[^"\\\n\r])*"/g;
    
    return !maybeHarmful.test(aString.replace(jsonStrings, ""));
  }
};
