form = [
  name: 'activity'
  label: 'E-Activity:'
  type: 'select'
  req: true
  err: 'Please indicate the E-Activity you have completed.'
  options: [
    ""
    "1st learning reflection"
    "Activity 3.1"
    "Activity 4.1"
    "2nd learning reflection"
    "3rd learning reflection"
  ]
 ,
   name: 'url'
   label: 'URL:'
   type: 'text'
   req: true
   note: 'Provide the URL to the specific blog post.'
   err: 'Please provide the URL to the specific blog post.'
 ,
   name: 'title'
   label: 'Title:'
   type: 'text'
   req: true
   err: 'Please enter the title of the post.'
 ,
   name: 'comment'
   label: 'Comment:'
   type: 'textarea'
   req: true
   err: 'Please provide a brief comment about the E-Activity.'
]
formtitle = 'Add to table'
rform = {}
autorow = []
automode = false
bottom = false
tid = ''

entityMap =
  "&": "&amp;"
  "<": "&lt;"
  ">": "&gt;"
  '"': '&quot;'
  "'": '&#39;'
  "/": '&#x2F;'

countries = [
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

# exceptions mapping country to flag name
flags =
  "Bahamas": "the Bahamas"
  "Brunei Darussalam": "Brunei"
  "Holy See": "the Vatican City"
  "Korea, Republic of": "South Korea"
  "Netherlands": "the Netherlands"
  "United Arab Emirates": "the United Arab Emirates"

escapeHTML = (s) ->
  return String(s).replace(/[&<>"'\/]/g, (s) ->
    entityMap[s])

isColor = (s) ->
  return false if (s.length != 4) and (s.length != 7)
  return s.search(/^#[0-9a-fA-F]+$/) > -1

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

formElement = (x, ix) ->
  r = "<td class=\"mw-label\"><label for=\"WErb#{ix}\">#{x.label}</label></td>"

  ni = "name=\"WErb#{ix}\" id=\"WErb#{ix}\""
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
    when "country", "flagc", "flagcl"
      r += '<td class="mw-input"><select ' + ni + '>'
      for o in countries
        [v, t, text, selected, disabled] = [o, o, o, false, false]
        r += "<option value=\"#{v}\" title=\"#{t}\""
        r += ' disabled="disabled"' if disabled
        r += ' selected' if selected
        r += ">#{text}</option>"
      r += "</select>
            <div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "radio"
      # not all browsers support reduce, so do it by hand
      allColors = true
      allColors &= isColor(o) for o in x.options
      r += "<td class=\"mw-input\"><radiogroup>"
      iy = 0
      for o in x.options
        checked = if iy is 0 then 'checked' else ''
        r += "<label><input type=\"radio\" name=\"WErb#{ix}\" value=\"#{o}\" #{checked}>"
        if allColors
          r += "<span style=\"background-color:#{o}; border-radius: 4px; border: 1px solid black;\">&nbsp;&nbsp;&nbsp;</span>"
        else
          r += o
        r += "&nbsp;&nbsp;</label>"
        iy++
      r += "</radiogroup><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "color"
      r += "<td class=\"mw-input\"><input #{ni} type=\"color\" size=\"40\""
      r += ' disabled="disabled"' if x.disabled
      r += " /><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "textarea"
      r += "<td class=\"mw-input\"><textarea #{ni} rows=3 cols=40></textarea><div style=\"font-size:smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "textdate"
      r += "<td class=\"mw-input\"><input class=\"WEdatepicker\" #{ni} type=\"text\" size=\"40\""
      r += ' disabled="disabled"' if x.disabled
      r += " /><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    else
      r += "<td class=\"mw-input\"><input #{ni} type=\"text\" size=\"40\""
      r += ' disabled="disabled"' if x.disabled
      r += " /><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"

abridge = (text) ->
  maxlen = 150
  if text.length > maxlen
    p = maxlen
    while p > 1 && text.charAt(p) isnt ' '
      p--
    text = text.slice(0, p-1)
  return text

insertRow = (text, row) ->
  if bottom
    p = text.indexOf('|}', text.indexOf("id=\"#{tid}\""))
  else
    p = text.indexOf('|-', text.indexOf("id=\"#{tid}\""))
  if p > 0
    start = text.slice(0, p-1)
    end = text.slice(p)
    return start + row + end
  return ''

submitForm = ->
  columnsummary = ''
  err = false
  ix = 0
  for element in form
    $es = $("#WErb#{ix}")
    v = $.trim($es.val())
    if element.req and v is ""
      $es.next().text(element.err).css('color', 'FireBrick')
      err = true
    else
      $es.next().html('&nbsp;')
      switch element.type
        when 'userpage'
          v = "[[User:#{wgUserName}|#{v}]]"
        when 'flagc'
          if v isnt ""
            if flags.hasOwnProperty(v)
              v = "{{FlagC|#{flags[v]}|#{v}}}"
            else:
              v = "{{FlagC|#{v}}}"
        when 'flagcl'
          if v isnt ""
            if flags.hasOwnProperty(v)
              v = "{{FlagCL|#{flags[v]}|#{v}}}"
            else:
              v = "{{FlagCL|#{v}}}"
        when 'radio'
          v = $("input[name=\"WErb#{ix}\"]:checked").val()
      rform[element.name] = v
      autorow.push(v)
      if element.summary
        columnsummary = v
    ix++
  if err
    return false
  # hide submit, show spinner
  $('#weAddToTableSubmit').hide()
  $('#WErbSpinner').show()
  # request page and edit token
  api
    prop: 'info|revisions'
    intoken: 'edit'
    rvprop: 'content'
    titles: window.wgPageName
    (d) ->
      #console.log(d)
      pages = d?.query?.pages
      for p of pages
        token = pages[p].edittoken
        #console.log('token=', token)
        text = pages[p].revisions[0]['*']
        #console.log(text)
        if rform.activity
          summary = "Add #{rform.activity}"
        else
          if columnsummary
            summary = "add #{columnsummary}"
          else
            summary = "add item"
        api
          action: 'edit'
          title: window.wgPageName
          summary: summary
          text: insertRow(text, row)
          token: token
          unwatch: 1
          (d) ->
            #console.log('saved!')
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
          ->
            alert("Unable to save row.  Please try later.")
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
        if rform.comment
          comment = abridge(rform.comment)
        ###
        api
          action: 'wenotes'
          notag: 'oeruesp'
          notext: "New #{rform.sport} (#{rform.focus}) resource: #{rform.title} #{rform.url} #{comment}"
          ->
            t = 1
          ->
            t = 2
        ###
        break
    ->
      pass = 1
  if automode
    row = autorow.slice(0)
    row.unshift("\n|-")
  else
    row = []
    row.push("\n|-")
    # make sure the URL starts with https?://
    url = rform.url
    if not /^https?:\/\//i.exec(url)
      url = "http://#{url}"
    row.push("[[User:#{rform.user}|#{rform.user_name}]]")
    row.push(rform.activity)
    row.push("[#{url} #{rform.title}]")
    row.push(rform.comment)
    row.push("\n")
  row = row.join("\n|") + "\n";
  # find table
  # insert row
  # save
  # if successful redirect
  return false

showForm = ->
  $('#weAddToTableDialog').dialog(
    height: 'auto'
    width: 'auto'
    title: escapeHTML(formtitle)
    show: 'slow')
  getUserName()
  dt = new Date()
  ds = "#{dt.getUTCFullYear()}-#{('0'+(dt.getUTCMonth()+1)).slice(-2)}-#{('0'+dt.getUTCDate()).slice(-2)} #{('0'+dt.getUTCHours()).slice(-2)}:#{('0'+dt.getUTCMinutes()).slice(-2)}"
  for x in form
    nd = "#WErb#{x.ix}"
    switch x.type
      when "user" then $(nd).val(wgUserName)
      when "date" then $(nd).val(ds.slice(0, 11))
      when "timestamp" then $(nd).val(ds)
  $('.WEdatepicker').datepicker({dateFormat: 'yy-mm-dd'})
  return false

getUserName = ->
  rform.user = window.wgUserName
  api
    meta: 'userinfo'
    uiprop: 'realname'
    (d) ->
      #console.log(d)
      if d.query?.userinfo
        userinfo = d.query.userinfo
        rform.user_name = userinfo.realname
        for x in form
          if x.type is "name" or x.type is "userpage"
            $("#WErb#{x.ix}").val(userinfo.realname)

parseColumns = (id, columns) ->
  columns = columns.split(';')
  form = []
  $("##{id}").find('th').each (i) ->
    # set up defaults based on table headings
    heading = $(this).text()
      .replace(/[\n\t\xA0]/g, ' ')
    heading = $.trim(heading)
    type = 'text'
    if heading.indexOf('*') > -1
      heading = heading.replace(/[*]/g, '')
      type = 'textarea'

    opts = []
    # merge in overrides from columns
    if i < columns.length and columns[i]
      note = ''
      cparams = columns[i].split('&')
      for cparam in cparams
        pp = cparam.split('=', 2)
        if pp.length is 1
          pp.push('')         # default arg
        ptype = $.trim(pp[0].toLowerCase())
        parg = $.trim(pp[1])
        switch ptype
          when 'type'
            switch parg
              when 'user' then type = 'user'
              when 'name' then type = 'name'
              when 'userpage' then type = 'userpage'
              when 'date' then type = 'date'
              when 'timestamp' then type = 'timestamp'
              when 'text' then type = 'text'
              when 'textarea' then type = 'textarea'
              when 'textdate' then type = 'textdate'
              when 'select' then type = 'select'
              when 'country' then type = 'country'
              when 'flagc', 'FlagC' then type = 'flagc'
              when 'flagcl', 'FlagCL' then type = 'flagcl'
              when 'radio' then type = 'radio'
              when 'color' then type = 'color'
              else type = 'text'  # default type
          when 'label'
            heading = parg
          when 'options'
            opts = parg.split('!')
            opts = ($.trim(opt).replace(/[^-_ #a-zA-Z0-9]/g, '') for opt in opts)
          when 'summary'
            summary = true
          when 'note'
            note = escapeHTML(parg)
    formitem =
      name: escape(heading)
      label: escapeHTML(heading)
      type: type
      options: opts
    formitem.summary = true if summary
    formitem.note = note if note

    form.push(formitem)
  return form

weAddToTable = (id, options) ->
  login = options.login || 'Login to add to the table'
  button = options.button || 'Add to table'
  formtitle = options.formtitle || 'Add to table'
  dialogWidth = options.width || 600
  dialogHeight = options.width || 400
  $did = $("#b#{id}")
  if window.wgUserName
    $did.append("<button></button>")
    $did.find('button').text(button)
  else
    $did.html("<a href=\"http://wikieducator.org/index.php?title=Special:UserLogin&returnto=#{window.wgPageName}\"></a>");
    $did.find('a').text(login)
    return false
  tid = id
  if options.bottom
    bottom = true
  if options.columns
    form = parseColumns(id, options.columns)
    automode = true
  else if options.auto
    automode = true
    form = []
    $("##{id}").find("th").each ->
      heading = $(this).text()
        .replace(/[\n\t\xA0]/g, ' ')
      heading = $.trim(heading);
      type = 'text'
      if heading.indexOf('*') > -1
        heading = heading.replace(/[*]/g, '')
        type = 'textarea'
      formitem =
        name: escape(heading)
        label: escapeHTML(heading)
        type: type
      form.push(formitem)
  $('body').append("""
  <div id="weAddToTableDialog" style="display:none;">
    <form id="fweAddToTable#{id}">
      <table></table>
    </form>
  </div>
  """)
  ix = 0;
  for element in form
    do (element, ix) ->
      $("#weAddToTableDialog > form > table").append('<tr>' +
        formElement(element, ix) + "</tr>\n");
        element.ix = ix
    ix++
  $('#weAddToTableDialog > form > table').append('''
  <tr><td>&nbsp;</td>
    <td><img id="WErbSpinner" src="/skins/common/images/ajax-loader.gif"
          height=16 width=16 style="display: none" /><button
          id="weAddToTableSubmit">Submit</button></td></tr>
  ''')
  $did.find('button').click(showForm)
  $('#weAddToTableSubmit').click(submitForm)
  return false

jQuery ->
  window.weAddToTable = weAddToTable
  #$('head').append('<style>.ui-datepicker {z-index: 9999;}</style>')
  return

