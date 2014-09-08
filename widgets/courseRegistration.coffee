form = [
  name: 'name'
  label: 'Name:'
  type: 'text'
  disabled: true
 ,
  name: 'country'
  label: 'Country:'
  type: 'select'
  req: true
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
]

# exceptions mapping country to flag name
flags =
  "Bahamas": "the Bahamas"
  "Brunei Darussalam": "Brunei"
  "Holy See": "the Vatican City"
  "Korea, Republic of": "South Korea"
  "Netherlands": "the Netherlands"
  "United Arab Emirates": "the United Arab Emirates"

fields = [
  name: 'blog'
  label: 'Blog Feed URL:'
  type: 'text'
  note: 'The URL of the blog you will use for the course.'
  req: false
 ,
  name: 'twitter'
  label: 'Twitter nickname:'
  type: 'text'
  req: false
 ,
  name: 'gplus'
  label: 'g+ id:'
  type: 'text'
  note: 'Visit <span class="plainlinks"><a href="https://plus.google.com/me" target="_blank">https://plus.google.com/me</a></span> then copy the URL with its 20 digit ID.'
  req: false
]

api = (data, success, failure) ->
  data.action ||= 'query'
  data.format ||= 'json'
  $.ajax(
    url: window.wgServer + '/api.php'
    type: 'POST'
    data: data
    success: success
    failure: failure
  )

userinfo = {}
uiCourses = {}

formElement = (x) ->
  r = "<td class=\"mw-label\"><label for=\"WE#{x.name}\">#{x.label}</label></td>"

  ni = "name=\"WE#{x.name}\" id=\"WE#{x.name}\""
  switch x.type
    when "select"
      r += '<td class="mw-input"><select ' + ni + '>'
      for o in x.options
        if typeof o is 'string'
          [v, t, text, selected, disabled] = [o, o, o, false, false]
        else
          [v, t, text, selected, disabled] = [o.value, o.title, o.text, o.selected, o.disabled]
        r += "<option value=\"#{v}\" title=\"#{t}\""
        r += ' disabled="disabled"' if disabled
        r += ' selected' if selected
        r += ">#{text}</option>"
      r += "</select>
            <div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "textarea"
      r += "<td class=\"mw-input\"><textarea #{ni} rows=2 cols=40></textarea><div style=\"font-size:smaller;\">#{x.note||'&nbsp;'}</div></td>"
    else
      r += "<td class=\"mw-input\"><input #{ni} type=\"text\" size=\"40\""
      r += ' disabled="disabled"' if x.disabled
      r += " /><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"

jQuery ->
  userinfo = {}
  coursePage = ''

  fs = """
    <form id="WEcourseRegister" action="#">
      <table>
       """

  if !window.weCourseFields
    return

  # append any valid fields specified by the user (in order)
  addfields = window.weCourseFields.toLowerCase().split(',')
  addfields = ($.trim(af) for af in addfields)
  for af in addfields
    for f in fields
      if f.name is af
        form.push f
        break

  for x in form
    fs += "<tr>#{formElement(x)}</tr>\n"

  fs += """
        <tr>
          <td class="mw-label">&nbsp;</td>
          <td class="mw-input"><img id="WEcourseSpinner" src="/skins/common/images/Ajax-loader.gif" height=16 width=16 style="display: none" /><div id="WEcourseRegisterSubmit"></div></td>
          </tr>
      </table>
    </form>
        """

  showUpdateButton = ->
    $('#WEcourseSpinner').hide();
    $('#WEcourseRegisterSubmit').html('<input id="WEcourseUpdate" type="submit" value="Update" />&nbsp;&nbsp;&nbsp;<small><a id="WEcourseUnsubscribe" href="#">Unsubscribe</a></small>')
    $('#WEcourseUpdate').click(courseUpdate)
    $('#WEcourseUnsubscribe').click(courseUnsubscribe)
    $('#WEcourseRegisterSubmit').show();

  updateUserOptions = (country) ->
    saveCourses = false
    changes = []
    country = $.trim($('#WEcountry').val())
    if country isnt ""
      changes.push("userjs-we-country=" + country)
    if 'twitter' in addfields
      th = $.trim($('#WEtwitter').val())
      if th.charAt(0) is '@'
        th = th.slice(1)
      if th isnt ""
        changes.push("userjs-we-twitter=" + th)
    if 'gplus' in addfields
      th = $.trim($('#WEgplus').val())
      if th isnt ""
        changes.push("userjs-we-gplus=" + th)
    if not uiCourses[window.weCourse]?
      uiCourses[window.weCourse] = {}
      saveCourses = true
    if 'blog' in addfields
      th = $.trim($('#WEblog').val())
      if th isnt ""
        if not /https?:/.test(th)
          if th.charAt(0) is '/'
            th = "http:/#{th}"
          else
            th = "http://#{th}"
        uiCourses[window.weCourse].blog = th
        saveCourses = true
    if saveCourses
      changes.push('userjs-we-courses=' + JSON.stringify(uiCourses).replace(/\|/g, ''))
    if changes.length isnt 0
      api
        action: 'weoptions'
        change: changes.join('|')

  createUserDashboard = (country) ->
    api
      prop: 'info'
      titles: "User:#{wgUserName}/#{window.weCourse}"
      intoken: 'edit'
      (d) ->
        token = d?.query?.pages[-1].edittoken
        text = coursePage
        if 'blog' in addfields
          text += "\n\n{{CourseBlog|1=" + $('#WEblog').val() + "}}"
        if country isnt ""
          if flags.hasOwnProperty(country)
            text += "\n\n{{FlagCL|#{flags[country]}|#{country}}}"
          else
            text += "\n\n{{FlagCL|#{country}}}"
        text += "\n\n[[Category:" + escape(window.weCourseCategory.replace(/\s/g, '_')) + "]]\n"
        summary = "#{window.weCourse} registration"
        if country isnt ""
          summary = summary + " from #{country}"
        api
          action: 'edit'
          token: token
          summary: summary
          text: text
          title: "User:#{wgUserName}/#{window.weCourse}"
          (d) ->
            showUpdateButton()
            $('#WEcourseFormLogin').append("You have registered.  <a href=\"/User:#{wgUserName}/#{window.weCourse}\">Go to your course dashboard</a>.")
          ->
            $('#WEcourseFormLogin').append("Registration failed.  Please try again later.  Sorry for the inconvenience")
      ->
        $('#WEcourseFormLogin').append("Registration failed.  Please try again later.  Sorry for the inconvenience")
    return false

  updateUserDashboard = (country) ->
    api
      prop: 'revisions'
      rvprop: 'content'
      titles: "User:#{wgUserName}/#{window.weCourse}"
      (d) ->
        text = ''
        if d && d.query && d.query.pages
          for i of d.query.pages
            if i>0
              text = d.query.pages[i].revisions[0]['*']
        if text
          api
            prop: 'info'
            titles: "User:#{wgUserName}/#{window.weCourse}"
            intoken: 'edit'
            (d) ->
              pages = d?.query?.pages
              for pg,v of pages
                break
              token = v['edittoken']
              if 'blog' in addfields
                blogurl = $.trim($('#WEblog').val())
                text = text.replace(/{{CourseBlog\|[^}]*}}/, "{{CourseBlog|1=#{blogurl}}}")
              if country isnt ""
                if flags.hasOwnProperty(country)
                  newFlagCL = "{{FlagCL|#{flags[country]}|#{country}}}"
                else
                  newFlagCL = "{{FlagCL|#{country}}}"
                text = text.replace(/{{FlagCL\|[^}]*}}/, newFlagCL)
              summary = "#{window.weCourse} registration update"
              api
                action: 'edit'
                token: token
                summary: summary
                text: text
                title: "User:#{wgUserName}/#{window.weCourse}"
                (d) ->
                  showUpdateButton()
    return false

  unsubscribeUserDashboard = (country) ->
    api
      prop: 'revisions'
      rvprop: 'content'
      titles: "User:#{wgUserName}/#{window.weCourse}"
      (d) ->
        text = ''
        if d && d.query && d.query.pages
          for i of d.query.pages
            if i>0
              text = d.query.pages[i].revisions[0]['*']
        if text
          api
            prop: 'info'
            titles: "User:#{wgUserName}/#{window.weCourse}"
            intoken: 'edit'
            (d) ->
              pages = d?.query?.pages
              for pg,v of pages
                break
              token = v['edittoken']
              text = text.replace(/\[\[Category:.*Participant]]/, '')
              summary = "#{window.weCourse} unsubscription"
              api
                action: 'edit'
                token: token
                summary: summary
                text: text
                title: "User:#{wgUserName}/#{window.weCourse}"
                (d) ->
                  showUpdateButton()
    return false

  courseRegister = ->
    $('#WEcourseRegisterSubmit').hide()
    $('#WEcourseSpinner').show()
    country = $.trim($('#WEcountry').val())
    updateUserOptions(country)
    createUserDashboard(country)
    return false

  courseUnsubscribe = ->
    $('#WEcourseRegisterSubmit').hide()
    $('#WEcourseSpinner').show()
    country = $.trim($('#WEcountry').val())
    unsubscribeUserDashboard(country)
    return false

  courseUpdate = ->
    $('#WEcourseRegisterSubmit').hide()
    $('#WEcourseSpinner').show()
    country = $.trim($('#WEcountry').val())
    updateUserOptions(country)
    updateUserDashboard(country)
    return false

  getUserinfo = (success, failure) ->
    api
      meta: 'userinfo'
      uiprop: 'email|realname|options'
      (d) ->
        if d.query?.userinfo
          userinfo = d.query.userinfo
          if window.wgUserName is null and ! userinfo.anon?
            window.wgUserName = userinfo.name
          success()
      ->
        failure()

  prepopulate = ->
    if userinfo.email is ''
      $('#WEcourseFormLogin').prepend('You <em>must</em> <a href="/Special:Preferences">provide an email address</a> to receive course announcements.<br />')
    else if not userinfo.emailauthenticated
      $('#WEcourseFormLogin').prepend('You should <a href="/Special:Preferences">verify your email address</a>.<br />')
    if userinfo.options['userjs-we-courses'] and userinfo.options['userjs-we-courses'] isnt ""
      uiCourses = $.parseJSON(userinfo.options['userjs-we-courses'])
    else
      uiCourses = {}
    $('#WEname').val(userinfo.realname)
    $('#WEcountry').val(userinfo.options?['userjs-we-country'])
    $('#WEgplus').val(userinfo.options?['userjs-we-gplus'])
    $('#WEtwitter').val(userinfo.options?['userjs-we-twitter'])
    $('#WEblog').val(uiCourses[window.weCourse]?.blog);

  removeForm = ->
    # something bad happened when trying to get userinfo to build form
    alert("Unable to complete registration now.\nPlease try later.")
    $('#WEcourseSubmit').remove()
    return false

  showForm = ->
    if window.wgUserName is null
      if window.weCourseClosed
        $('#WEcourseFormLogin').text(window.weCourseClosed)
        return false

      # FIXME constant returnto that contains a widget that
      #     bounces you back into the snapshot
      $('#WEcourseFormLogin').html("You must be <a id=\"WEcourseFormGoLogin\" href=\"/index.php?title=Special:UserLogin&returnto=Practice:OCL4Ed/_Registration\">logged in</a> to register or update your information.")
      return false
    $('#WEcourseForm').html(fs)
    $('#WEcourseFormLogin').html("&nbsp;")
    api
      prop: 'revisions'
      rvprop: 'content'
      titles: "User:#{window.wgUserName}/#{window.weCourse}|MediaWiki:Course-#{window.weCourse}"
      (d) ->
        pages = d?.query?.pages
        for p of pages
          if pages[p].title.slice(0, 5) is 'User:'
            if pages[p].hasOwnProperty('missing')
              if window.weCourseClosed
                $('#WEcourseForm').html('')
                $('#WEcourseFormLogin').text(window.weCourseClosed)
                return false
            else
              showUpdateButton()
              $('#WEcourseFormLogin').append("You are already registered for this course.  <a href=\"/User:#{wgUserName}/#{window.weCourse}\">Go to your course dashboard</a>.")
              return
          if pages[p].title.slice(0, 10) is 'MediaWiki:'
            if pages[p].hasOwnProperty('missing')
              $('#WEcourseFormLogin').html("Can not read course information.")
              return
            else
              coursePage = "{{:" + pages[p].title + "}}\n\n"
        #$('#WEcourseFormLogin').html('')
        $('#WEcourseRegisterSubmit').html('<input id="WEcourseSubmit" type="submit" value="Register" />').click(courseRegister)
      ->
        pass = 1
    if userinfo.realname?
      prepopulate()
    else
      getUserinfo(prepopulate, removeForm)

  if window.wgUserName is null
    getUserinfo(showForm)
  else
    showForm()
