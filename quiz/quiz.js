/*
 * experimental GIFT quiz support
 *
 * Copyright 2015 Open Education Resource Foundation
 * Licensed under: GNU Public License 2.1
 *
 * 20151124 jimt@onjapan.net
 */

'use strict';
var qa, qas, quiz,
    qs = [],
    qtext = $('pre').html();

// augment q by adding q.name, return remaining v string
function getQuestionName(q, v) {
  var re;
  if (v.indexOf('::') === 0) {
    v = v.slice(2);
    // if there is an end of name marker, there is a name
    re = /\s*(.*?)\s*::(.*)/.exec(v);
    if (re && re.length >= 3) {
      q.name = re[1];
      v = re[2];
    }
  }
  return v;
}

// read and ignore (FIXME) the question format string
function getQuestionFormat(q, v) {
  var re;
  if (v[0] === '[') {
    re = /\[(.*?)\](.*)/.exec(v);
    if (re && re.length >= 3) {
      q.format = re[1];
      v = re[2];
    } else {
      q.type = 'error';
      q.message = 'Missing ] to close question format';
    }
  }
  return v;
}

function getQuestionAnswers(q, v) {
  var a, as, re, parts,
      answerString = '';
  if (v.indexOf('{') === -1) {
    // a description is a question without answers
    q.type = 'description';
    return v;
  }

  // there better be a closing bracket
  if (v.indexOf('}') === -1) {
    q.type = 'error';
    q.message = 'Missing } to close answer block';
    return v;
  }
  re = /\s*(.*?){\s*(.*?)\s*}.*/.exec(v);
  if (re && re.length >= 3) {
    v = re[1];
    answerString = re[2];
    // general feedback (must be at end?)
    re = /(.*)####\s*(.*)/.exec(answerString);
    if (re && re.length >= 3) {
      q.feedback = re[2];
      answerString = re[1];
    }
  }

  // essay questions have empty answer text
  if (answerString === '') {
    q.type = 'essay';
    return v;
  }

  // multichoice questions have (at least one?) tilde
  if (answerString.indexOf('~') > -1) {
    q.type = 'multichoice';
    // split into individual answers (with optional feedback on each)
    q.answers = [];
    q.feedbacks = [];
    while (answerString.length) {
      re = /((=|~)[^=~]*)(.*)/.exec(answerString);
      if (re && re.length >= 2) {
        parts = re[1].split('#');
        q.answers.push($.trim(parts[0]));
        if (parts.length === 2) {
          q.feedbacks.push($.trim(parts[1]));
        } else {
          q.feedbacks.push('');
        }
      }
      if (re && re.length >= 3) {
        answerString = $.trim(re[3]);
      } else {
        answerString = '';
      }
    }
    return v;
  }

  // matching questions have = and ->
  if ((answerString.indexOf('=') > -1) && (answerString.indexOf('->') > -1)) {
    q.type = 'matching';
    return v;
  }

  // if answer is TRUE, T, FALSE, F then true/false
  re = /((TRUE)|T|(FALSE)|F)(\s*#.*)?/i.exec(answerString);
  if (re && re.length >= 4) {
    q.type = 'truefalse';
    // make it look more like a multiple choice question
    switch (re[3]) {
      case 'T':
          q.answers = ['=T', '~F'];
          break;
      case 'TRUE':
          q.answers = ['=True', '~False'];
          break;
      case 'F':
          q.answers = ['~T', '=F'];
          break;
      default:
          q.answers = ['~True', '=False'];
    }
    if (re.length >= 5) {
      q.feedbacks = $.trim(re[4]).slice(1).split('#', 2);
    }
    return v;
  }

  // must be a short answer
  q.type = 'shortanswer';
  return v;
}

function addQuestion(v, i, a) {
  var q = {};
  v = v.replace(/\n/g, ' ');
  v = $.trim(v);
  console.log('addQuestion', i, v);
  if (v === '') {
    return;
  }
  // save the original format
  q.qa = v;

  // directives are questions that start with $
  if (v[0] === '$') {
    q.type = 'directive';
    qs.push(q);
    return;
  }

  v = getQuestionName(q, v);
  v = getQuestionFormat(q, v);
  if (q.type === 'error') {
    qs.push(q);
    return;
  }
  v = getQuestionAnswers(q, v);

  q.text = $.trim(v);
  // if we didn't have a name, use the question text
  if (!q.hasOwnProperty('name')) {
    q.name = q.text;
  }
  qs.push(q);
}

function renderQuestion(q, i) {
  if (q.type != 'directive') {
    quiz += '<li>';
  }
  switch(q.type) {
    case 'directive':
      // FIXME ignore all directives
      break;
    case 'description':
      quiz += q.text;
      break;
    case 'truefalse':
    case 'multichoice':
      quiz += q.text + '<ul>';
      q.answers.forEach(function(a, i) {
        quiz += '<li><label><input type="checkbox">' + a.slice(1) + '</label>';
        quiz += '<div style="font-style: italic; color: grey;">' + q.feedbacks[i] + '</div>';
        quiz += '</li>';
      });
      quiz += '</ul>';
      break;
    case 'error':
      quiz += '<span style="color: red;">' + q.message + '</span>';
      break;
    case 'shortanswer':
      quiz += q.text + '&nbsp;<input type="text">';
      break;
    default:
      quiz += '<span style="color: red;">Unknown question type ' + q.type + '</span>';
  }
  // if question has general feedback
  if (q.feedback) {
    quiz += '<div style="font-style: italic; color: darkgreen;">' + q.feedback + '</div>';
  }
  if (q.type != 'directive') {
    quiz += '</li>';
  }
}

// remove comments and p tags
qtext = qtext.replace(/\/\/[^\n]*\n/g, '');
qtext = qtext.replace(/&lt;\/?p&gt;/g, '');

// split into questions
qas = qtext.split(/\n( *\n)+/);
console.log('qas', qas);

// parse the questions
qas.forEach(addQuestion);
console.log('qs', qs);

// render the questions
quiz = '';
qs.forEach(renderQuestion);

// styling
$('head').append('<style>\n.WEquizGIFT ul { list-style-type: none; list-style-image: none; }\n.WEquizGIFT>ol>li { margin-bottom: 1em; }</style>');
// put the quiz on the page
$('.WEquizGIFT pre').replaceWith('<ol>' + quiz + '</ol>');
