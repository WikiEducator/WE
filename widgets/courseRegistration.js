(function () {
  'use strict';

  const form = [
    {
      name: 'name',
      label: 'Name:',
      type: 'text',
      disabled: true
    },
    {
      name: 'country',
      label: 'Country:',
      type: 'select',
      req: true,
      options: [
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
      ]
    }
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

  const fields = [
    {
      name: 'blog',
      label: 'Blog Feed URL:',
      type: 'text',
      note: 'The URL of the blog you will use for the course.',
      req: false
    },
    {
      name: 'twitter',
      label: 'Twitter nickname:',
      type: 'text',
      req: false
    },
    {
      name: 'gplus',
      label: 'g+ id:',
      type: 'text',
      note: 'Visit <span class="plainlinks"><a href="https://plus.google.com/me" target="_blank">https://plus.google.com/me</a></span> then copy the URL with its 20 digit ID.',
      req: false
    }
  ];

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

  // get a csrf token (also valid for action=options), then call success(token)
  function withToken(success, failure) {
    return api({
      meta: 'tokens'
    }, function (d) {
      success(d && d.query && d.query.tokens && d.query.tokens.csrftoken);
    }, failure);
  }

  let userinfo = {};
  let uiCourses = {};
  // may be updated from userinfo if the page was served from an anonymous cache
  let wgUserName = null;

  function formElement(x) {
    let r = `<td class="mw-label"><label for="WE${x.name}">${x.label}</label></td>`;
    const ni = `name="WE${x.name}" id="WE${x.name}"`;
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
      case "textarea":
        r += `<td class="mw-input"><textarea ${ni} rows=2 cols=40></textarea><div style="font-size:smaller;">${x.note || '&nbsp;'}</div></td>`;
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

  function main() {
    wgUserName = mw.config.get('wgUserName');
    userinfo = {};
    let coursePage = '';

    let fs = `<form id="WEcourseRegister" action="#">
  <table>`;

    if (!window.weCourseFields) {
      return;
    }

    // append any valid fields specified by the user (in order)
    const addfields = window.weCourseFields.toLowerCase().split(',').map(function (af) {
      return $.trim(af);
    });
    addfields.forEach(function (af) {
      const f = fields.find(function (field) {
        return field.name === af;
      });
      if (f) {
        form.push(f);
      }
    });

    form.forEach(function (x) {
      fs += `<tr>${formElement(x)}</tr>\n`;
    });

    fs += `    <tr>
      <td class="mw-label">&nbsp;</td>
      <td class="mw-input"><span id="WEcourseSpinner" style="display: none"></span><div id="WEcourseRegisterSubmit"></div></td>
      </tr>
  </table>
</form>`;

    function showUpdateButton() {
      $('#WEcourseSpinner').hide();
      $('#WEcourseRegisterSubmit').html('<input id="WEcourseUpdate" type="submit" value="Update" />&nbsp;&nbsp;&nbsp;<small><a id="WEcourseUnsubscribe" href="#">Unsubscribe</a></small>');
      $('#WEcourseUpdate').click(courseUpdate);
      $('#WEcourseUnsubscribe').click(courseUnsubscribe);
      $('#WEcourseRegisterSubmit').show();
    }

    function updateUserOptions(country) {
      let saveCourses = false;
      const changes = [];
      let th;
      country = $.trim($('#WEcountry').val());
      if (country !== "") {
        changes.push("userjs-we-country=" + country);
      }
      if (addfields.includes('twitter')) {
        th = $.trim($('#WEtwitter').val());
        if (th.charAt(0) === '@') {
          th = th.slice(1);
        }
        if (th !== "") {
          changes.push("userjs-we-twitter=" + th);
        }
      }
      if (addfields.includes('gplus')) {
        th = $.trim($('#WEgplus').val());
        if (th !== "") {
          changes.push("userjs-we-gplus=" + th);
        }
      }
      if (uiCourses[window.weCourse] == null) {
        uiCourses[window.weCourse] = {};
        saveCourses = true;
      }
      if (addfields.includes('blog')) {
        th = $.trim($('#WEblog').val());
        if (th !== "") {
          if (!/https?:/.test(th)) {
            if (th.charAt(0) === '/') {
              th = `https:/${th}`;
            } else {
              th = `https://${th}`;
            }
          }
          uiCourses[window.weCourse].blog = th;
          saveCourses = true;
        }
      }
      if (saveCourses) {
        changes.push('userjs-we-courses=' + JSON.stringify(uiCourses).replace(/\|/g, ''));
      }
      if (changes.length !== 0) {
        withToken(function (token) {
          api({
            action: 'options',
            change: changes.join('|'),
            token: token
          }, function () {
          });
        });
      }
    }

    function createUserDashboard(country) {
      withToken(function (token) {
        let text = coursePage;
        if (addfields.includes('blog')) {
          text += "\n\n{{CourseBlog|1=" + $('#WEblog').val() + "}}";
        }
        if (country !== "") {
          if (flags.hasOwnProperty(country)) {
            text += `\n\n{{FlagCL|${flags[country]}|${country}}}`;
          } else {
            text += `\n\n{{FlagCL|${country}}}`;
          }
        }
        text += "\n\n[[Category:" + escape(window.weCourseCategory.replace(/\s/g, '_')) + "]]\n";
        let summary = `${window.weCourse} registration`;
        if (country !== "") {
          summary = summary + ` from ${country}`;
        }
        api({
          action: 'edit',
          token: token,
          summary: summary,
          text: text,
          title: `User:${wgUserName}/${window.weCourse}`
        }, function () {
          showUpdateButton();
          $('#WEcourseFormLogin').append(`You have registered.  <a href="/User:${wgUserName}/${window.weCourse}">Go to your course dashboard</a>.`);
        }, function () {
          $('#WEcourseFormLogin').append("Registration failed.  Please try again later.  Sorry for the inconvenience");
        });
      }, function () {
        $('#WEcourseFormLogin').append("Registration failed.  Please try again later.  Sorry for the inconvenience");
      });
      return false;
    }

    // fetch the wikitext of the user's course dashboard and, if there is
    // any, call success(text)
    function withDashboardText(success) {
      api({
        prop: 'revisions',
        rvprop: 'content',
        titles: `User:${wgUserName}/${window.weCourse}`
      }, function (d) {
        let text = '';
        if (d && d.query && d.query.pages) {
          for (const i in d.query.pages) {
            if (i > 0) {
              text = d.query.pages[i].revisions[0]['*'];
            }
          }
        }
        if (text) {
          success(text);
        }
      });
    }

    function updateUserDashboard(country) {
      withDashboardText(function (text) {
        withToken(function (token) {
          if (addfields.includes('blog')) {
            const blogurl = $.trim($('#WEblog').val());
            text = text.replace(/{{CourseBlog\|[^}]*}}/, `{{CourseBlog|1=${blogurl}}}`);
          }
          if (country !== "") {
            let newFlagCL;
            if (flags.hasOwnProperty(country)) {
              newFlagCL = `{{FlagCL|${flags[country]}|${country}}}`;
            } else {
              newFlagCL = `{{FlagCL|${country}}}`;
            }
            text = text.replace(/{{FlagCL\|[^}]*}}/, newFlagCL);
          }
          api({
            action: 'edit',
            token: token,
            summary: `${window.weCourse} registration update`,
            text: text,
            title: `User:${wgUserName}/${window.weCourse}`
          }, function () {
            showUpdateButton();
          });
        });
      });
      return false;
    }

    function unsubscribeUserDashboard(country) {
      withDashboardText(function (text) {
        withToken(function (token) {
          text = text.replace(/\[\[Category:.*Participant]]/, '');
          api({
            action: 'edit',
            token: token,
            summary: `${window.weCourse} unsubscription`,
            text: text,
            title: `User:${wgUserName}/${window.weCourse}`
          }, function () {
            showUpdateButton();
          });
        });
      });
      return false;
    }

    function courseRegister() {
      $('#WEcourseRegisterSubmit').hide();
      $('#WEcourseSpinner').show();
      const country = $.trim($('#WEcountry').val());
      updateUserOptions(country);
      createUserDashboard(country);
      return false;
    }

    function courseUnsubscribe() {
      $('#WEcourseRegisterSubmit').hide();
      $('#WEcourseSpinner').show();
      const country = $.trim($('#WEcountry').val());
      unsubscribeUserDashboard(country);
      return false;
    }

    function courseUpdate() {
      $('#WEcourseRegisterSubmit').hide();
      $('#WEcourseSpinner').show();
      const country = $.trim($('#WEcountry').val());
      updateUserOptions(country);
      updateUserDashboard(country);
      return false;
    }

    function getUserinfo(success, failure) {
      api({
        meta: 'userinfo',
        uiprop: 'email|realname|options'
      }, function (d) {
        if (d.query && d.query.userinfo) {
          userinfo = d.query.userinfo;
          if (wgUserName === null && userinfo.anon == null) {
            wgUserName = userinfo.name;
          }
          success();
        }
      }, function () {
        if (failure) {
          failure();
        }
      });
    }

    function prepopulate() {
      const options = userinfo.options || {};
      if (userinfo.email === '') {
        $('#WEcourseFormLogin').prepend('You <em>must</em> <a href="/Special:Preferences">provide an email address</a> to receive course announcements.<br />');
      } else if (!userinfo.emailauthenticated) {
        $('#WEcourseFormLogin').prepend('You should <a href="/Special:Preferences">verify your email address</a>.<br />');
      }
      if (options['userjs-we-courses'] && options['userjs-we-courses'] !== "") {
        uiCourses = JSON.parse(options['userjs-we-courses']);
      } else {
        uiCourses = {};
      }
      $('#WEname').val(userinfo.realname);
      $('#WEcountry').val(options['userjs-we-country']);
      $('#WEgplus').val(options['userjs-we-gplus']);
      $('#WEtwitter').val(options['userjs-we-twitter']);
      $('#WEblog').val(uiCourses[window.weCourse] ? uiCourses[window.weCourse].blog : undefined);
    }

    function removeForm() {
      // something bad happened when trying to get userinfo to build form
      alert("Unable to complete registration now.\nPlease try later.");
      $('#WEcourseSubmit').remove();
      return false;
    }

    function showForm() {
      if (wgUserName === null) {
        if (window.weCourseClosed) {
          $('#WEcourseFormLogin').text(window.weCourseClosed);
          return false;
        }

        // FIXME constant returnto that contains a widget that
        //     bounces you back into the snapshot
        $('#WEcourseFormLogin').html('You must be <a id="WEcourseFormGoLogin" href="/index.php?title=Special:UserLogin&returnto=Practice:OCL4Ed/_Registration">logged in</a> to register or update your information.');
        return false;
      }
      $('#WEcourseForm').html(fs);
      $('#WEcourseSpinner').append($.createSpinner({size: 'small', type: 'inline'}));
      $('#WEcourseFormLogin').html("&nbsp;");
      api({
        prop: 'revisions',
        rvprop: 'content',
        titles: `User:${wgUserName}/${window.weCourse}|MediaWiki:Course-${window.weCourse}`
      }, function (d) {
        const pages = (d && d.query && d.query.pages) || {};
        for (const p in pages) {
          if (pages[p].title.slice(0, 5) === 'User:') {
            if (pages[p].hasOwnProperty('missing')) {
              if (window.weCourseClosed) {
                $('#WEcourseForm').html('');
                $('#WEcourseFormLogin').text(window.weCourseClosed);
                return;
              }
            } else {
              showUpdateButton();
              $('#WEcourseFormLogin').append(`You are already registered for this course.  <a href="/User:${wgUserName}/${window.weCourse}">Go to your course dashboard</a>.`);
              return;
            }
          }
          if (pages[p].title.slice(0, 10) === 'MediaWiki:') {
            if (pages[p].hasOwnProperty('missing')) {
              $('#WEcourseFormLogin').html("Can not read course information.");
              return;
            } else {
              coursePage = "{{:" + pages[p].title + "}}\n\n";
            }
          }
        }
        //$('#WEcourseFormLogin').html('')
        $('#WEcourseRegisterSubmit').html('<input id="WEcourseSubmit" type="submit" value="Register" />').click(courseRegister);
      }, function () {
      });
      if (userinfo.realname != null) {
        prepopulate();
      } else {
        getUserinfo(prepopulate, removeForm);
      }
    }

    if (wgUserName === null) {
      getUserinfo(showForm);
    } else {
      showForm();
    }
  }

  // This script is loaded by a plain <script> tag in the page body, which
  // runs before ResourceLoader has loaded jQuery and mw, so queue the start-up.
  (window.RLQ = window.RLQ || []).push(function () {
    mw.loader.using(['jquery.spinner']).then(function () {
      jQuery(main);
    });
  });
}());
