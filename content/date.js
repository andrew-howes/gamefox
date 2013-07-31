/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009, 2011, 2013 Brian Marshall
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
 * Date parsing and formatting.
 * @namespace
 */
var gamefox_date =
{
  // http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html
  formats: {
    topic:   ['%n/%e %i:%M%p',
              '%m/%d %i:%M%p',
              '%m/%d %H:%M',
              '%d/%m %i:%M%p',
              '%d/%m %H:%M'],
    message: ['%n/%e/%Y %i:%M:%S %p',
              '%m/%d/%Y %i:%M:%S %p',
              '%m/%d/%Y %H:%M:%S',
              '%d/%m/%Y %i:%M:%S %p',
              '%d/%m/%Y %H:%M:%S',
              '%Y-%m-%d %i:%M:%S %p',
              '%Y-%m-%d %H:%M:%S'],
    clock:   ['%n/%e/%Y %i:%M:%S %p',
              '%m/%d/%Y %i:%M:%S %p',
              '%m/%d/%Y %H:%M:%S',
              '%d/%m/%Y %i:%M:%S %p',
              '%d/%m/%Y %H:%M:%S',
              '%Y-%m-%d %i:%M:%S %p',
              '%Y-%m-%d %H:%M:%S']
  },

  /**
   * List of date regexes: [regex, orderOfParts].
   *
   * Make sure the first character of each orderOfParts string is filler, since
   * regex result arrays have the full string at index 0.
   */
  _regexes: [
      [/(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)/,
       '_mdyhMsp'],
      [/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2})(AM|PM)/, '_mdhMp'],
      [/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '_mdy']
  ],

  get enabled() {
    return gamefox_lib.prefs.getBoolPref('date.enableFormat');
  },

  getFormat: function(type, id)
  {
    if (id == null)
      id = gamefox_lib.prefs.getIntPref('date.' + type + 'Preset');

    if (id == -1)
      return gamefox_lib.getString('date.' + type + 'Custom');

    return this.formats[type][id];
  },

  listFormats: function(type)
  {
    return this.formats[type];
  },

  /**
   * Parse a GameFAQs date string.
   *
   * @param {string} str
   * @return {Date}
   */
  strtotime: function(str)
  {
    let now = new Date();
    let nowYear = now.getFullYear();
    let year, month, day, hour, minute, second;

    // Try each regex and use the first match
    for (let i = 0; i < this._regexes.length; i++) {
      let r = this._regexes[i][0].exec(str);
      let o = this._regexes[i][1];
      if (!r)
        continue;

      year   = +r[o.indexOf('y')];
      month  = +r[o.indexOf('m')] - 1;
      day    = +r[o.indexOf('d')];
      hour   = +r[o.indexOf('h')];
      minute = +r[o.indexOf('M')];
      second = +r[o.indexOf('s')];
      if (r[o.indexOf('p')] === 'PM' && hour !== 12)
        hour += 12;
      else if(r[o.indexOf('p')] === 'AM' && hour == 12)
      	hour -= 12;

      // The Date constructor will fail if it finds NaN instead of ignoring it.
      // It will ignore nulls however
      let date = new Date(isNaN(year) ? nowYear : year,
          isNaN(month)  ? null : month,
          isNaN(day)    ? null : day,
          isNaN(hour)   ? null : hour,
          isNaN(minute) ? null : minute,
          isNaN(second) ? null : second);

      // If the year isn't defined and the date appears to be in the future,
      // assume it's from last year instead
      if (isNaN(year) && date > now)
        date.setFullYear(nowYear - 1);

      return date;
    }
    return null;
  },

  convertTo12H: function(hours)
  {
    return hours > 12 ? hours - 12 : (hours == 0 ? 12 : hours);
  },

  parseFormat: function(dateStr, format)
  {
    var date = dateStr ? new Date(dateStr) : new Date();
    if (date == 'Invalid Date')
      date = gamefox_date.strtotime(dateStr);

    // Custom conversions, since strftime isn't adequate
    format = format.replace(/%e/g, date.getDate())
                   .replace(/%n/g, date.getMonth() + 1)
                   .replace(/%i/g, this.convertTo12H(date.getHours()));

    return date.toLocaleFormat(format);
  }
};
