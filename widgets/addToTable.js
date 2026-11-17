(function () {
  'use strict';

  let form = [
    {
      name: 'activity',
      label: 'E-Activity:',
      type: 'select',
      req: true,
      err: 'Please indicate the E-Activity you have completed.',
      options: [
        "",
        "1st learning reflection",
        "Activity 3.1",
        "Activity 4.1",
        "2nd learning reflection",
        "3rd learning reflection"
      ]
    },
    {
      name: 'url',
      label: 'URL:',
      type: 'text',
      req: true,
      note: 'Provide the URL to the specific blog post.',
      err: 'Please provide the URL to the specific blog post.'
    },
    {
      name: 'title',
      label: 'Title:',
      type: 'text',
      req: true,
      err: 'Please enter the title of the post.'
    },
    {
      name: 'comment',
      label: 'Comment:',
      type: 'textarea',
      req: true,
      err: 'Please provide a brief comment about the E-Activity.'
    }
  ];
  let formtitle = 'Add to table';
  const rform = {};
  const autorow = [];
  let automode = false;
  let bottom = false;
  let tid = '';

  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  const countries = [
    "", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra",
    "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina",
    "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas",
    "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
    "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
    "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory",
    "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
    "Cameroon", "Canada", "Cape Verde", "Cayman Islands",
    "Central African Republic", "Chad", "Chile", "China",
    "Christmas Island",
    "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo",
    "Cook Islands", "Costa Rica",
    "Cote D'ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
    "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands",
    "Fiji", "Finland", "France", "French Guiana", "French Polynesia",
    "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany",
    "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe",
    "Guam", "Guatemala", "Guinea", "Guinea-bissau", "Guyana", "Haiti",
    "Heard Island and Mcdonald Islands", "Holy See",
    "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia",
    "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Korea, Democratic People's Republic of", "Korea, Republic of",
    "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic",
    "Latvia", "Lebanon", "Lesotho", "Liberia", "Libyan Arab Jamahiriya",
    "Liechtenstein", "Lithuania", "Luxembourg", "Macao",
    "Macedonia", "Madagascar", "Malawi",
    "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
    "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico",
    "Micronesia, Federated States of", "Moldova, Republic of",
    "Monaco", "Mongolia", "Montserrat", "Morocco", "Mozambique",
    "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
    "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua",
    "Niger", "Nigeria", "Niue", "Norfolk Island",
    "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau",
    "Palestinian Territory", "Panama", "Papua New Guinea",
    "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal",
    "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation",
    "Rwanda", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia",
    "Saint Pierre and Miquelon", "Saint Vincent and The Grenadines",
    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
    "Senegal", "Serbia and Montenegro", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
    "South Africa", "South Georgia",
    "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen",
    "Swaziland", "Sweden", "Switzerland", "Syrian Arab Republic",
    "Taiwan", "Tajikistan",
    "Tanzania", "Thailand", "Timor-leste",
    "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia",
    "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "UNESCO", "USA",
    "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Viet Nam",
    "Virgin Islands, British", "Virgin Islands, U.S.", "Wallis and Futuna",
    "Western Sahara", "Yemen", "Zambia", "Zimbabwe"
  ];

  // exceptions mapping country to flag name
  const flags = {
    "Bahamas": "the Bahamas",
    "Brunei Darussalam": "Brunei",
    "Holy See": "the Vatican City",
    "Korea, Republic of": "South Korea",
    "Netherlands": "the Netherlands",
    "United Arab Emirates": "the United Arab Emirates"
  };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"'\/]/g, function (c) {
      return entityMap[c];
    });
  }

  function isColor(s) {
    if ((s.length !== 4) && (s.length !== 7)) {
      return false;
    }
    return s.search(/^#[0-9a-fA-F]+$/) > -1;
  }

  function api(data, success, failure) {
    data.action = data.action || 'query';
    data.format = data.format || 'json';
    return $.ajax({
      url: mw.config.get('wgServer') + '/api.php',
      type: 'POST',
      data: data,
      success: success,
      error: failure
    });
  }

  function formElement(x, ix) {
    let r = `<td class="mw-label"><label for="WErb${ix}">${x.label}</label></td>`;
    const ni = `name="WErb${ix}" id="WErb${ix}"`;
    const note = `<div style="font-size: smaller;">${x.note || '&nbsp;'}</div></td>`;

    switch (x.type) {
      case "select":
        r += '<td class="mw-input"><select ' + ni + '>';
        x.options.forEach(function (o) {
          let v, t, text, selected, disabled;
          if (typeof o === 'string') {
            [v, t, text, selected, disabled] = [o, o, o, false, false];
          } else {
            [v, t, text, selected, disabled] = [o.value, o.title, o.text, o.selected, o.disabled];
          }
          r += `<option value="${v}" title="${t}"`;
          if (disabled) {
            r += ' disabled="disabled"';
          }
          if (selected) {
            r += ' selected';
          }
          r += `>${text}</option>`;
        });
        r += '</select> ' + note;
        break;
      case "country":
      case "flagc":
      case "flagcl":
        r += '<td class="mw-input"><select ' + ni + '>';
        countries.forEach(function (o) {
          r += `<option value="${o}" title="${o}">${o}</option>`;
        });
        r += '</select> ' + note;
        break;
      case "radio": {
        // not all browsers support reduce, so do it by hand
        let allColors = true;
        x.options.forEach(function (o) {
          allColors = allColors && isColor(o);
        });
        r += '<td class="mw-input"><radiogroup>';
        x.options.forEach(function (o, iy) {
          const checked = (iy === 0) ? 'checked' : '';
          r += `<label><input type="radio" name="WErb${ix}" value="${o}" ${checked}>`;
          if (allColors) {
            r += `<span style="background-color:${o}; border-radius: 4px; border: 1px solid black;">&nbsp;&nbsp;&nbsp;</span>`;
          } else {
            r += o;
          }
          r += "&nbsp;&nbsp;</label>";
        });
        r += '</radiogroup>' + note;
        break;
      }
      case "color":
        r += `<td class="mw-input"><input ${ni} type="color" size="40"`;
        if (x.disabled) {
          r += ' disabled="disabled"';
        }
        r += ' />' + note;
        break;
      case "textarea":
        r += `<td class="mw-input"><textarea ${ni} rows=3 cols=40></textarea><div style="font-size:smaller;">${x.note || '&nbsp;'}</div></td>`;
        break;
      case "textdate":
        r += `<td class="mw-input"><input class="WEdatepicker" ${ni} type="text" size="40"`;
        if (x.disabled) {
          r += ' disabled="disabled"';
        }
        r += ' />' + note;
        break;
      default:
        r += `<td class="mw-input"><input ${ni} type="text" size="40"`;
        if (x.disabled) {
          r += ' disabled="disabled"';
        }
        r += ' />' + note;
    }
    return r;
  }

  function abridge(text) {
    const maxlen = 150;
    if (text.length > maxlen) {
      let p = maxlen;
      while (p > 1 && text.charAt(p) !== ' ') {
        p--;
      }
      text = text.slice(0, p - 1);
    }
    return text;
  }

  function insertRow(text, row) {
    let p;
    if (bottom) {
      p = text.indexOf('|}', text.indexOf(`id="${tid}"`));
    } else {
      p = text.indexOf('|-', text.indexOf(`id="${tid}"`));
    }
    if (p > 0) {
      const start = text.slice(0, p - 1);
      const end = text.slice(p);
      return start + row + end;
    }
    return '';
  }

  function submitForm() {
    let columnsummary = '';
    let err = false;
    let row;
    form.forEach(function (element, ix) {
      const $es = $(`#WErb${ix}`);
      let v = $.trim($es.val());
      if (element.req && v === "") {
        $es.next().text(element.err).css('color', 'FireBrick');
        err = true;
      } else {
        $es.next().html('&nbsp;');
        switch (element.type) {
          case 'userpage':
            v = `[[User:${mw.config.get('wgUserName')}|${v}]]`;
            break;
          case 'flagc':
            if (v !== "") {
              if (flags.hasOwnProperty(v)) {
                v = `{{FlagC|${flags[v]}|${v}}}`;
              } else {
                v = `{{FlagC|${v}}}`;
              }
            }
            break;
          case 'flagcl':
            if (v !== "") {
              if (flags.hasOwnProperty(v)) {
                v = `{{FlagCL|${flags[v]}|${v}}}`;
              } else {
                v = `{{FlagCL|${v}}}`;
              }
            }
            break;
          case 'radio':
            v = $(`input[name="WErb${ix}"]:checked`).val();
            break;
        }
        rform[element.name] = v;
        autorow.push(v);
        if (element.summary) {
          columnsummary = v;
        }
      }
    });
    if (err) {
      return false;
    }
    // hide submit, show spinner
    $('#weAddToTableSubmit').hide();
    $('#WErbSpinner').show();
    // request page and edit (csrf) token
    api({
      prop: 'revisions',
      meta: 'tokens',
      rvprop: 'content',
      titles: mw.config.get('wgPageName')
    }, function (d) {
      //console.log(d)
      const token = d && d.query && d.query.tokens && d.query.tokens.csrftoken;
      const pages = (d && d.query && d.query.pages) || {};
      let summary, comment;
      for (const p in pages) {
        //console.log('token=', token)
        const text = pages[p].revisions[0]['*'];
        //console.log(text)
        if (rform.activity) {
          summary = `Add ${rform.activity}`;
        } else if (columnsummary) {
          summary = `add ${columnsummary}`;
        } else {
          summary = "add item";
        }
        api({
          action: 'edit',
          title: mw.config.get('wgPageName'),
          summary: summary,
          text: insertRow(text, row),
          token: token,
          unwatch: 1
        }, function () {
          //console.log('saved!')
          window.location = `${mw.config.get('wgServer')}/${mw.config.get('wgPageName')}?1`;
        }, function () {
          alert("Unable to save row.  Please try later.");
          window.location = `${mw.config.get('wgServer')}/${mw.config.get('wgPageName')}?1`;
        });
        if (rform.comment) {
          comment = abridge(rform.comment);
        }
        /*
        api({
          action: 'wenotes',
          notag: 'oeruesp',
          notext: `New ${rform.sport} (${rform.focus}) resource: ${rform.title} ${rform.url} ${comment}`
        }, function () {
          t = 1;
        }, function () {
          t = 2;
        });
        */
        break;
      }
    }, function () {
    });
    if (automode) {
      row = autorow.slice(0);
      row.unshift("\n|-");
    } else {
      row = [];
      row.push("\n|-");
      // make sure the URL starts with https?://
      let url = rform.url;
      if (!/^https?:\/\//i.exec(url)) {
        url = `https://${url}`;
      }
      row.push(`[[User:${rform.user}|${rform.user_name}]]`);
      row.push(rform.activity);
      row.push(`[${url} ${rform.title}]`);
      row.push(rform.comment);
      row.push("\n");
    }
    row = row.join("\n|") + "\n";
    // find table
    // insert row
    // save
    // if successful redirect
    return false;
  }

  function getUserName() {
    rform.user = mw.config.get('wgUserName');
    api({
      meta: 'userinfo',
      uiprop: 'realname'
    }, function (d) {
      //console.log(d)
      if (d.query && d.query.userinfo) {
        const userinfo = d.query.userinfo;
        rform.user_name = userinfo.realname;
        form.forEach(function (x) {
          if (x.type === "name" || x.type === "userpage") {
            $(`#WErb${x.ix}`).val(userinfo.realname);
          }
        });
      }
    });
  }

  function showForm() {
    $('#weAddToTableDialog').dialog({
      height: 'auto',
      width: 'auto',
      title: escapeHTML(formtitle),
      show: 'slow'
    });
    getUserName();
    const pad = function (n) {
      return ('0' + n).slice(-2);
    };
    const dt = new Date();
    const ds = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
    form.forEach(function (x) {
      const nd = `#WErb${x.ix}`;
      switch (x.type) {
        case "user":
          $(nd).val(mw.config.get('wgUserName'));
          break;
        case "date":
          $(nd).val(ds.slice(0, 11));
          break;
        case "timestamp":
          $(nd).val(ds);
          break;
      }
    });
    $('.WEdatepicker').datepicker({dateFormat: 'yy-mm-dd'});
    return false;
  }

  function parseColumns(id, columns) {
    columns = columns.split(';');
    form = [];
    $(`#${id}`).find('th').each(function (i) {
      // set up defaults based on table headings
      let heading = $(this).text()
        .replace(/[\n\t\xA0]/g, ' ');
      heading = $.trim(heading);
      let type = 'text';
      if (heading.indexOf('*') > -1) {
        heading = heading.replace(/[*]/g, '');
        type = 'textarea';
      }

      let opts = [];
      let summary = false;
      let note = '';
      // merge in overrides from columns
      if (i < columns.length && columns[i]) {
        columns[i].split('&').forEach(function (cparam) {
          const pp = cparam.split('=', 2);
          if (pp.length === 1) {
            pp.push('');         // default arg
          }
          const ptype = $.trim(pp[0].toLowerCase());
          const parg = $.trim(pp[1]);
          switch (ptype) {
            case 'type':
              switch (parg) {
                case 'user':
                case 'name':
                case 'userpage':
                case 'date':
                case 'timestamp':
                case 'text':
                case 'textarea':
                case 'textdate':
                case 'select':
                case 'country':
                case 'radio':
                case 'color':
                  type = parg;
                  break;
                case 'flagc':
                case 'FlagC':
                  type = 'flagc';
                  break;
                case 'flagcl':
                case 'FlagCL':
                  type = 'flagcl';
                  break;
                default:
                  type = 'text';  // default type
              }
              break;
            case 'label':
              heading = parg;
              break;
            case 'options':
              opts = parg.split('!').map(function (opt) {
                return $.trim(opt).replace(/[^-_ #a-zA-Z0-9]/g, '');
              });
              break;
            case 'summary':
              summary = true;
              break;
            case 'note':
              note = escapeHTML(parg);
              break;
          }
        });
      }
      const formitem = {
        name: escape(heading),
        label: escapeHTML(heading),
        type: type,
        options: opts
      };
      if (summary) {
        formitem.summary = true;
      }
      if (note) {
        formitem.note = note;
      }

      form.push(formitem);
    });
    return form;
  }

  function weAddToTable(id, options) {
    const login = options.login || 'Login to add to the table';
    const button = options.button || 'Add to table';
    formtitle = options.formtitle || 'Add to table';
    const $did = $(`#b${id}`);
    if (mw.config.get('wgUserName')) {
      $did.append("<button></button>");
      $did.find('button').text(button);
    } else {
      $did.html(`<a href="/index.php?title=Special:UserLogin&returnto=${encodeURIComponent(mw.config.get('wgPageName'))}"></a>`);
      $did.find('a').text(login);
      return false;
    }
    tid = id;
    if (options.bottom) {
      bottom = true;
    }
    if (options.columns) {
      form = parseColumns(id, options.columns);
      automode = true;
    } else if (options.auto) {
      automode = true;
      form = [];
      $(`#${id}`).find("th").each(function () {
        let heading = $(this).text()
          .replace(/[\n\t\xA0]/g, ' ');
        heading = $.trim(heading);
        let type = 'text';
        if (heading.indexOf('*') > -1) {
          heading = heading.replace(/[*]/g, '');
          type = 'textarea';
        }
        form.push({
          name: escape(heading),
          label: escapeHTML(heading),
          type: type
        });
      });
    }
    $('body').append(`<div id="weAddToTableDialog" style="display:none;">
  <form id="fweAddToTable${id}">
    <table></table>
  </form>
</div>`);
    form.forEach(function (element, ix) {
      $("#weAddToTableDialog > form > table").append('<tr>' +
        formElement(element, ix) + "</tr>\n");
      element.ix = ix;
    });
    $('#weAddToTableDialog > form > table').append(`<tr><td>&nbsp;</td>
  <td><span id="WErbSpinner" style="display: none"></span><button
        id="weAddToTableSubmit">Submit</button></td></tr>`);
    $('#WErbSpinner').append($.createSpinner({size: 'small', type: 'inline'}));
    $did.find('button').click(showForm);
    $('#weAddToTableSubmit').click(submitForm);
    return false;
  }

  // defined immediately (not on document ready) so that the widget's
  // $.getScript() callback can call it; dialog/datepicker/spinner are
  // loaded on demand
  window.weAddToTable = function (id, options) {
    mw.loader.using(['jquery.ui', 'jquery.spinner']).then(function () {
      weAddToTable(id, options);
    });
    return false;
  };
  //$('head').append('<style>.ui-datepicker {z-index: 9999;}</style>')
}());
