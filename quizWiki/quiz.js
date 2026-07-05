/*
 * quizWiki - a wiki-centric GIFT subset
 *
 * Copyright 2016 Open Education Resource Foundation
 * @license MIT
 *
 */
/* jshint: jquery:true */
"use strict";
var SHOWSPEED = 'fast';
var quizNo = 0,
    quizzes = [];

// entitize escaped control characters
function entityize(s) {
  return s.replace(/\\[~=#{}]/g, function(m) {
    return '&#' + m.charCodeAt(1) + ';';
  });
}

// shuffle an array in place
function shuffle(array) {
  var m = array.length, i, temp;

  while (m > 0) {
    i = Math.floor(Math.random() * m);
    m--;
    temp = array[m];
    array[m] = array[i];
    array[i] = temp;
  }

  return array;
}

// return true if all fields in a cloze question have non-blank entries
function clozeAllAnswered($q) {
  var answered = true;
  $q.find('input').each(function() {
    answered = answered && ($.trim($(this).val()) !== '');
  });
  return answered;
}

// immediately grade a single response
function gradeResponse($rinput) {
  var rNo, $r, qNo, $q, q, quizNo, answers, feedback;
  // given $r points to a response input, figure out quiz, question, response
  var id = $rinput.attr('id'),
      mo = id.match(/qwR-(\d+)-(\d+)-(\d+)/);
  if (mo.length !== 4) {
    return false;
  }
  quizNo = mo[1];
  qNo = mo[2];
  rNo = mo[3];
  q = quizzes[quizNo].questions[qNo];
  switch (q.type) {
    case 'multiple':
    case 'multi':
    case 'truefalse':
      $r = $rinput.closest('.qwR').find('.qwF,.qwFc').show(SHOWSPEED);
      break;
    case 'cloze':
      $q = $rinput.closest('.quizWikiQ');
      if (clozeAllAnswered($q)) {
        $q.find('.qwF').show(SHOWSPEED);
        $q.find('input').each(function(i) {
          var answer = $.trim($(this).val()).toLowerCase(),
              correct = false;
          q.answers[i].forEach(function(a) {
            correct = correct || (answer === a.r.toLowerCase());
          });
          $(this).css('background-color', (correct) ? 'LightGreen' : 'LightPink');
        });
      }
      break;
  }
}

function gradeQuestion(i, q, quizNo, quiz, options) {
  var $q, answers, answered, feedback;
  $q = $('#quizWikiQuiz-' + quizNo).children('.quizWikiQ').eq(i);
  switch (q.type) {
    case 'multiple':
    case 'multi':
    case 'truefalse':
      answers = q.answers[0];
      // for all the responses, if checked show feedback
      //   (if not already shown)
      $q.find('.qwR').each(function(rNo) {
        if ($(this).find('input').prop('checked') || options.feedbackStyle === 'all' || ((options.feedbackStyle === 'correct') && answers[rNo].c)) {
          $(this).find('.qwF,.qwFc').show(SHOWSPEED);
        }
      });
      break;
    case 'cloze':
      answered = options.clozeUnattempted || (options.feedbackStyle === 'all') || (options.feedbackStyle === 'correct') || clozeAllAnswered($q);
      if (answered) {
        $q.find('.qwF').show(SHOWSPEED);
        $q.find('input').each(function(i) {
          var answer = $.trim($(this).val()).toLowerCase(),
              correct = false;
          q.answers[i].forEach(function(a) {
            correct = correct || (answer === a.r.toLowerCase());
          });
          $(this).css('background-color', (correct) ? 'LightGreen' : 'LightPink');
        });
      }
      break;
    default:
      break;
  }
}

// grade all the questions in a quiz, on submit
function gradeQuiz(quizNo, options) {
  quizzes[quizNo].questions.forEach(function(q, i) {
    gradeQuestion(i, q, quizNo, quizzes[quizNo], options);
  });
}

// return a map of options that apply to this quiz
function parseQuizOptions($quiz) {
  var $submit, $options, ops, options = {};
  // if there is a submit span, uses its contents for a submit button
  $submit = $quiz.find('.quizWikiSubmit');
  if ($submit.length) {
    options.submit = $submit.text();  // text only buttons
  }

  // if there is an option span, parse into options
  $options = $quiz.find('.quizWikiOptions');
  if ($options.length) {
    ops = $options.text().split(';');
    ops.forEach(function(v, i) {
      var opt, arg;
      v = $.trim(v.toLowerCase()).split('=');
      opt = $.trim(v[0]);
      if (v.length > 1) {
        arg = $.trim(v[1]);
      }
      switch (opt) {
        case 'mix':
        case 'multi':
          options[opt] = true;
          break;
        case 'feedback':
          if (arg) {
            options.feedbackStyle = arg;
          }
          break;
        case 'cloze':
          if (arg === 'unattempted') {
            options.clozeUnattempted = true;
          }
          break;
      }
    });
  }
  return options;
}

// fill-in the blank/cloze if text follows answer block
// short answer if at end and all options are correct
function isCloze(q) {
  var r, a = true;
  r = /.*{[^}*]}\s*\S/.test(q);
  if (r) {
    return true;
  }
  if (q.answers.length) {
    q.answers[0].forEach(function(v) {
      a = a && v.c;
    });
    return a;
  }
  return false;
}

function isTrueFalse(q) {
  var r = true;
  if (q.answers.length === 1) {
    if ((q.answers[0].length === 1) || (q.answers[0].length ===2)) {
      q.answers[0].forEach(function(v, i) {
        r = r && /^=?(t|true|f|false)$/.test(v.r.toLowerCase());
      });
      return r;
    }
  }
  return false;
}

// check for more than one correct answer
function isMulti(q) {
  var c = 0;
  if (q.answers.length) {
    q.answers[0].forEach(function(v) {
      if (v.c) {
        c += 1;
      }
    });
    return (c > 1);
  }
  return false;
}

// return a map for this answer block
function parseAnswerBlock(s) {
  var answers, ab = [];
  s = $.trim(s.slice(1, -1)); // remove {} and enclosing whitespace
  if (s.length === 0) {
    return [{r: ''}];
  }
  // split into individual answers
  answers = s.match(/(=|~)[^=~]*/g);
  // assume a one word answer with no leading =|~
  if (!answers) {
    answers = ['=' + s];
  }
  // split the feedback off each answer
  answers.forEach(function(v) {
    var x = {},
        p = v.split('#');
    x.c = (v.charAt(0) === '=');
    x.r = $.trim(p[0].slice(1));
    if (p.length > 1) {
      x.f = $.trim(p[1]);
    }
    ab.push(x);
  });
  return ab;
}

// return an array of maps of the same length
//   as the array of answer block strings
function parseAnswers(answersStrings) {
  var answers = [];
  answersStrings.forEach(function(v) {
    answers.push(parseAnswerBlock(v));
  });
  return answers;
}

function multipleMulti(q, quizNo, qNo, options) {
  var s = [],
      rid = 'qwR-' + quizNo + '-' + qNo + '-',
      radioGroup = 'qwRG-' + quizNo + '-' + qNo;
  q.html = q.html.replace(/{[^}]*}\s*/g, '');
  s = [];
  q.answers[0].forEach(function(v, i) {
    var ar;
    if ((q.type === 'truefalse') || ((q.type === 'multiple') && !options.multi)) {
      ar = '<li class="qwR"><label><input id="' + rid + i + '" type="radio" name="' + radioGroup + '" value="' + v.r + '">' + v.r + '</label>';
    } else {
      ar = '<li class="qwR"><label><input id="' + rid + i + '" type="checkbox">' + v.r + '</label>';
    }
    if (v.c) {
      ar += '<div class="qwFc">' + (v.f || 'Correct') + '</div>';
    } else {
      ar += '<div class="qwF">' + (v.f || 'Incorrect') + '</div>';
    }
    ar += '</li>';
    s.push(ar);
  });
  if (options.mix && (q.type !== 'truefalse')) {
    shuffle(s);
  }
  q.html += '<ul>' + s.join('\n') + '</ul>';
  return q;
}

function parseQuestion($q, quizNo, qNo, options) {
  var rNo = 0,
      rid = 'qwR-' + quizNo + '-' + qNo + '-',
      q = {html: entityize($q.html())},
      answers;
  // strip off question name
  q.html = q.html.replace(/^\s*::(.*?::)?\s*/, '');
  // strip off question format
  q.html = q.html.replace(/^\[[^]*]]/, '');
  answers = q.html.match(/{[^}]*}/g);
  if (!answers) {
    q.type = 'description';
  } else {
    q.answers = parseAnswers(answers);
    if ((q.answers.length === 1) && (answers.v === '')) {
      q.type = 'essay';
    } else if (isTrueFalse(q)) {
      q.type = 'truefalse';
      // answer block may not contain both true and false answers
      if (q.answers[0].length < 2) {
        if (['true', 't'].indexOf(q.answers[0][0].r.toLowerCase()) >= 0) {
          q.answers[0][0].r = 'True';
          q.answers[0].push({r: 'False'});
        } else {
          q.answers[0][0].r = 'False';
          q.answers[0].unshift({r: 'True'});
        }
      }
      q = multipleMulti(q, quizNo, qNo, options);
    } else if (isCloze(q)) {
      q.type = 'cloze';
      q.html = q.html.replace(/{[^}]*}/g, function () {
        var r ='<input id="' + rid + rNo + '" type="text">';
        rNo += 1;
        return r;
      });
      q.answers.forEach(function(ab) {
        ab.forEach(function(v) {
          if (v.f) {
            q.html += '<div class="qwF">' + v.f + '</div>';
          }
        });
      });
    } else {
      q.type = isMulti(q) ? 'multi' : 'multiple';
      q = multipleMulti(q, quizNo, qNo, options);
    }
  }

  return q;
}

// render a question in situ, return a map describing the question
function renderQuestion($q, quizNo, qNo, options) {
  var q = parseQuestion($q, quizNo, qNo, options);
  $q.replaceWith('<li class="quizWikiQ quizWikiQ-' + q.type + '">' + q.html + '</li>');
  return q;
}

// render every question in the quiz
function renderQuiz($quiz, quizNo) {
  var options = {}, questions = [];

  options = parseQuizOptions($quiz);

  $quiz.children('ul,ol').first()
    .addClass('quizWikiQuiz')
    .attr('id', 'quizWikiQuiz-' + quizNo)
    .wrap('<form></form>')
    .children('li').each(function(i) {
      questions.push(renderQuestion($(this), quizNo, i, options));
    });

  if (options.submit) {
    $quiz.append('<button>' + options.submit + '</button>');
    $quiz.find('button').click(function() {
           gradeQuiz(quizNo, options);
         });
  } else {
    $quiz.find('input[type="radio"],input[type="checkbox"]').click(function() {
      gradeResponse($(this));
    });
    $quiz.find('input[type="text"]').blur(function() {
      gradeResponse($(this));
    });
  }

  return {questions: questions, options: options};
}

// stuff the specified questions (or all of them)
//  into the quiz
function transcludeQuestions(banks) {
  $('.quizWikiBank').each(function() {
    var c, line, bankCopy, qlist = [],
        $q, qtitle, found, mo,
        bankName = $.trim($(this).text()),
        $l = $(this).closest('li'),
        questions = [];
    if (banks[bankName]) {
      if ($(this).attr('data-random')) {
        // random questions
        c = $(this).attr('data-random');
        bankCopy = banks[bankName].slice(0);
        shuffle(bankCopy);
        // while still questions to choose from, and haven't added enough
        while (bankCopy.length && c > 0) {
          line = bankCopy.shift();
          if (line.indexOf('//') !== 0) {
            questions.push('<li>' + line + '</li>');
            c--;
          }
        }
      } else {
        $q = $(this).closest('li').find('.quizWikiBankQuestions');
        if ($q.length) {
          // specific questions
          qlist = $q.text().split(';'); // FIXME unescape semicolons
          while (qlist.length) {
            qtitle = $.trim(qlist.shift());
            found = false;
            banks[bankName].forEach(function(line) {
              if (line.indexOf('//') !== 0) {
                mo = line.match(/(?:::)?(.*)::/);
                if (mo && (mo.length >= 2) && (mo[1] === qtitle)) {
                  questions.push('<li>' + line + '</li>');
                  found = true;
                }
              }
            });
            if (!found) {
              questions.push('<li>Did not find ::' + qtitle + ':: in question bank ' + bankName + '</li>');
            }
          }
        } else {
          // all questions
          banks[bankName].forEach(function(line) {
            if (line.indexOf('//') !== 0) {
              questions.push('<li>' + line + '</li>');
            }
          });
        }
      }
      $l.replaceWith(questions.join('\n'));
    } else {
      $l.replaceWith('<li>Unable to load question bank ' + bankName +'</li>');
    }
  });
}

// return an array of lines from a question bank
//   where each line is a comment or a question
// (TODO comments are kept so that someday questions
//  might be specified by Moodle export number)
function processBank(s) {
  var fragments = [], r = [],
      lines = s.split('\n');

  lines.forEach(function(line) {
    if (line === '') {
      if (fragments) {
        r.push(fragments.join(' '));
      }
      fragments = [];
    } else if (line.indexOf('//') === 0) {
      r.push(line);
    } else {
      fragments.push(line);
    }
  });
  if (fragments) {
    r.push(fragments.join(' '));
  }
  return r;
}

function fetchWikiPages(callback) {
  var banks = {}, bankskeys = [];
  // build a map of all distinct banks we need to fetch
  $('.quizWikiBank').each(function() {
    var bank = $.trim($(this).text());
    if (bankskeys.indexOf(bank) === -1) {
      bankskeys.push(bank);
    }
  });
  if (bankskeys.length) {
    // fetch the wikitext of those pages
    $.ajax({
      type: 'POST',
      url: '/api.php',
      data: {
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        format: 'json',
        titles: bankskeys.join('|')
      },
      dataType: 'json',
      success: function(d) {
        var page, pageIx, pages;
        if (d && d.query && d.query.pages) {
          pages = d.query.pages;
          for (pageIx in pages) {
            if (pages.hasOwnProperty(pageIx)) {
              page = pages[pageIx];
              // FIXME - reconcile canonical title and user version
              if (page.revisions && page.revisions.length) {
                banks[page.title] = processBank(page.revisions[0]['*']);
              }
            }
          }
        }
        callback(banks);
      },
      failure: function(err) {
        alert('Unable to fetch question bank(s)\n' + err);
        callback({});
      }
    });
  } else {
    callback({});
  }
}

// use this as a sentinel so we run only once per page
if ($('#quizWikiStyle').length === 0) {
  $('head').append(['<style id="quizWikiStyle">',
      '.quizWikiQ {margin-bottom: 1em;}',
      '.qwR {list-style-type: none; list-style-image: none;}',
      '.qwF,.qwFc {display: none;}',
      '.quizWiki button {margin: 1em 3em;}',
      '</style>'].join('\n'));

  // 1. fetch any question banks we need
  fetchWikiPages(function(banks) {
    // 2. transclude the desired questions
    if (banks) {
      transcludeQuestions(banks);
    }
    // 3. render every quiz on the page
    $('.quizWiki').each(function() {
      if (!$(this).hasClass('quizWikiLive')) {
        quizzes.push(renderQuiz($(this), quizNo));
        quizNo += 1;
        $(this).addClass('quizWikiLive');
      }
    });
  });
}

