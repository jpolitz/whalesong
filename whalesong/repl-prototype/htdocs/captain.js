"use strict";

function Node(name, taskSpec, outlinks, create) {
    return {
        name: name,
        task: taskSpec,
        outlinks: outlinks,
        create: create
    };
}

function User(name, userNodes) {
    return {
        name: name,
        nodes: userNodes
    };
}

function UserNode(user, node, task, blockingTasks) {
    return {
        user: user,
        node: node,
        nodeTask: task,
        blockingTasks: blockingTasks
    };
}

function Task(spec, completed, work, reviews) {
    if(typeof reviews === "undefined") { reviews = []; }
    return {
        spec: spec,
        completed: completed,
        work: work,
        reviews: reviews
    };
}

function TaskSpec(name, create, description, view) {
    return {
        name: name,
        create: create,
        view: view,
        description: description
    };
}

function Review(by, content, viewed) {
  if (typeof viewed === 'undefined') { viewed = false; }
  return {
    by: by,
    content: content,
    viewed: viewed
  }
}

function taskDone(userNode) {
    if(! userNode.nodeTask.completed) {
      userNode.nodeTask.completed = true;
      var newNodes = userNode.node.outlinks.map(function (node) {
          userNode.user.nodes[node.name] = node.create(userNode.user);
      });
    }
    draw();
}

// Tasks!
var ddTaskSpec = TaskSpec("ddTaskSpec", function (work) {
   return Task(ddTaskSpec, false, work);
}, "Data definitions for file system", function(userNode, task) {
    var d = jQuery("<div>");
    var instructions = jQuery("<p>Instructions:  Write data definitions for files and directories where files have names and sizes and directories have a name and contain files and other directories.</p>");
    instructions.css({
      'width': '300px',
      'padding': '1em'
    });
    var t = jQuery("<textarea class='code'>");
    t.val(task.work);
    var repl = makeRepl({ initialWritable : t });
    var b = jQuery("<button>Done with my data definitions</button>");
    b.click(function() {
      userNode.nodeTask.work = t.val();
      taskDone(userNode);
    });
    d.append(instructions).append(repl).append("<br/>").append(b);
    return d;
});

var exampleTaskSpec = TaskSpec("exampleTaskSpec",
      function(work) {
        return Task(exampleTaskSpec, false, work);
      },
      "Example data for file system",
      function(userNode, task) {
        var d = jQuery("<div>");
        var textDefs = jQuery("<textarea>");
        var textWork = jQuery("<textarea>");
        textWork.val(task.work);
        textDefs.val(userNode.user.nodes["dd"].nodeTask.work);

        var repl = makeRepl({ initialUnwritable: textDefs,
                              initialWritable: textWork });

        var b = jQuery("<button>Done with my examples</button>");

        var reviewsDiv = jQuery("<div>");
        var reviewsHeader = jQuery("<h3>Reviews:</h3>");
        var reviewsList = jQuery("<ul>");
        task.reviews.forEach(function(review) {
          review.viewed = true;

          var reviewItem = jQuery("<li>");
          var reviewColor = review.content.good ? '#cf9' : '#f99'; 
          var reviewDiv = jQuery("<div>");
          reviewDiv.css({
            'background-color': reviewColor,
            'width': '400px',
            'padding': '1em'
          });
          reviewItem.append(jQuery("<br/>"));
          var reviewText = jQuery("<textarea disabled='disabled'>" + review.content.comments + "</textarea>");
          reviewItem.append(reviewText);
          reviewText.css({
            width: '350px',
            height: (review.content.comments.split("\n").length + 2) + 'em'
          });
          reviewsList.append(reviewDiv.append(reviewItem));
        });
        reviewsDiv.append(reviewsHeader).append(reviewsList);

        b.click(function() {
          userNode.nodeTask.work = textWork.val();
          taskDone(userNode);
        });
        if(task.reviews.length > 0) {
          d.append(reviewsDiv);
        }
        d.append(repl).append("<br/>").append(b);
        return d;
      });

var exampleReviewTaskSpec = TaskSpec("exampleReviewTaskSpec",
      function(work) /*:
                       { definitions: str, examples : str, targetNode : UserNode,
                         review: Review<{comments : string, good : boolean}> }
                      */ {
        return Task(exampleReviewTaskSpec, false, work);
      },
      "Review this data definition and examples",
      function(userNode, task) {
        var d = jQuery("<div>");
        var textToReview = jQuery("<textarea class='code'>");
        textToReview.val(task.work.definitions + "\n" + task.work.examples);
        var textReview = jQuery("<textarea class='code'>");
        textReview.val(task.work.review.content.comments);

        var repl = makeRepl({ initialUnwritable : textToReview });

        var okCheckbox = jQuery("<input type='checkbox'>");
        okCheckbox.prop('checked', task.work.review.content.good);

        var okLabel = jQuery("<label>Looks good!</label>");
        var okDiv = jQuery("<div>").append(okLabel).append(okCheckbox);

        var b = jQuery("<button>Submit</button>");
        b.click(function() {
          task.work.review.content.comments = textReview.val();
          task.work.review.content.good = okCheckbox.prop('checked');
          task.completed = true;
          task.work.targetNode.nodeTask.reviews.push(Review(userNode.user, task.work.review.content));
          draw();
        });
        d.append(repl).append("<br/>").append(textReview).append("<br/>").append(okDiv).append("<br/>").append(b);
        return d;
      });

var templateTaskSpec = TaskSpec("templateTaskSpec", function () {
   return Task(templateTaskSpec, false, "");
}, "Templates for file system", function(userNode, task) {
    var d = jQuery("<div>");
    d.append("not yet implemented");
    return d;
})


var stubTaskSpec = TaskSpec("stubTaskSpec", function () {
   return Task(stubTaskSpec, false, "");
}, "Stubbed my toe", function(userNode, task) {
    var d = jQuery("<div>");
    d.append("not yet implemented");
    return d;
})

var stubReviewTaskSpec = TaskSpec("stubReviewTaskSpec", function () {
    return Task(stubReviewTaskSpec, false, "Read this stuff!");
}, "Review some work", function(userNode, task) {
    var d = jQuery("<div>").append("Review some stuff");
    var b = jQuery("<button>Submit</button>");
    b.click(function() {
        task.completed = true; // bad, as we normally don't have this
        draw();
    });
    d.append("<br/>").append(b);
    return d;
});


var user1 = User("Henry", {});
var user2 = User("Dancing Queen", {});
var user3 = User("Edward Teach", {});
var allUsers = [user1, user2, user3];
var currentUser = user1;


// Nodes!
var codeNode = Node("code", stubTaskSpec, [], function (user) {
    return UserNode(user, codeNode, stubTaskSpec.create(), [], false);
});
var testsNode = Node("tests", stubTaskSpec, [codeNode], function (user) {
    return UserNode(user, testsNode, stubTaskSpec.create(), [], false);
});
var contractNode = Node("contract", stubTaskSpec, [testsNode], function (user) {
    return UserNode(user, contractNode, stubTaskSpec.create(), [], false);
});
var templateNode = Node("template", templateTaskSpec, [contractNode], function (user) {
    var eligible = allUsers.filter(function(u) {
      var notMe = u !== user;
      var completedExamples = u.nodes.hasOwnProperty("example") &&
                                u.nodes["example"].nodeTask.completed;
      return notMe && completedExamples;
    });
    var reviewTasks = [];
    if (eligible.length > 0) {
      var ix = Math.floor(Math.random() * eligible.length);
      var targetUser = eligible[ix];
      var targetNode = targetUser.nodes["example"];
      reviewTasks.push(exampleReviewTaskSpec.create({
        // Note(joe): should *copy* here
        definitions: targetUser.nodes["dd"].nodeTask.work,
        examples: targetUser.nodes["example"].nodeTask.work,
        targetNode: targetNode,
        review: Review(user, { good: false, comments: "" })
      }));
    }
    return UserNode(user, templateNode, templateTaskSpec.create(), reviewTasks, false);
});
var exampleNode = Node("example", exampleTaskSpec, [templateNode], function (user) {
    return UserNode(user, exampleNode, exampleTaskSpec.create("# Example data:"), [], false);
});
var ddNode = Node("dd", ddTaskSpec, [exampleNode], function (user) {
    return UserNode(user, ddNode, ddTaskSpec.create("# Data definitions: "), [], false);
});

user1.nodes[ddNode.name] = ddNode.create(user1);
user2.nodes[ddNode.name] = ddNode.create(user2);
user3.nodes[ddNode.name] = ddNode.create(user3);

function draw() {
    jQuery("#users").html("Become: ");
    jQuery(".stage").removeClass("active");
    jQuery(".stage").removeClass("current");
    jQuery(".stage").removeClass("completed");
    jQuery(".stage").removeClass("blocked");
    jQuery(".stage").empty();
    allUsers.forEach(function (user) {
        if (user === currentUser) {
            jQuery("#users").append(jQuery("<button>").text(user.name + "*"));
        } else {
            jQuery("#users").append(jQuery("<button>").text(user.name)
                                    .click(function () {
                                        switchUser(user);
                                    }));
        }
    });

    drawStages(currentUser.nodes["dd"]);  
}

function drawStages(userNode) {
    var domNode = jQuery("#" + userNode.node.name);
    domNode.unbind();
    domNode.removeClass('current');
    domNode.empty();
    var task = userNode.nodeTask;
    var desc = jQuery("<span>" + task.spec.description + "</code>");
    domNode.append(desc);
    var blockingTasks = userNode.blockingTasks
        .filter(function (t) { return !t.completed; });
    jQuery("#contents").empty();
    domNode.click(function () {
        if (blockingTasks.length !== 0) {
            task = blockingTasks[0];
        }
        draw();
        domNode.addClass('current');
        var taskDom = task.spec.view(userNode, task);
        jQuery("#contents").empty().append(taskDom);
    });
    var reviews = userNode.nodeTask.reviews;
    var unreadReviews = reviews.filter(function(r) { return !r.viewed; });
    if (reviews.length > 0) {
      var unread = unreadReviews.length;
      var bgcolor = unread > 0 ? 'red' : 'darkgray';
      var count = unread > 0 ? unread : reviews.length;
      var reviewBang = jQuery("<div>" + count + "</div>");
      reviewBang.css({
        'font-weight': 'bold',
        'position': 'relative',
        'bottom': '0px',
        'right': '0',
        'margin': '5px',
        'color': 'white',
        'background-color': bgcolor,
        'border': '1px solid black',
        'width': '1em',
        'text-align': 'center'
      });
      domNode.append(reviewBang);
    }
    if (userNode.nodeTask.completed) {
        jQuery("#" + userNode.node.name).addClass("completed");
        userNode.node.outlinks.forEach(function (node) {
            drawStages(currentUser.nodes[node.name]);
        });
    } else {
        if (blockingTasks.length !== 0) {
          domNode.addClass("blocked") ;
        } else {
          domNode.addClass("active");
        }
    }

}

function switchUser(user) {
    currentUser = user;
    draw();
}

// Loads from localstorage users, tasks, etc
function loadData() {

}

// Inverse of loadData()
function persistData() {
    
}

// write a demo set of data to localStorage
function initializeData() {
    
}


jQuery(function() {
    draw();
    //reviewTest();
});

function reviewTest() {
  var $ = jQuery;
  $("#dd").click();
  $("#contents .code").val("data File:\n  | file(name, size) \nend");
  $("#contents button").click();
  $("#example").click();
  $("#contents .code:enabled").val("file('passwd', 28)");
  $("#contents button").click();

  switchUser(user2);

  $("#dd").click();
  $("#contents .code").val("data File:\n  | file(user2name, user2size) end");
  $("#contents button").click();
  $("#example").click();
  $("#contents .code:enabled").val("file('user2passwd', 28)");
  $("#contents button").click();

  $("#template").click();
  $('#contents .code:enabled').val("Nice try, but:\n" +
    "\n"
+ "1.  You forgot the name field on file()\n");
  $('#contents button').click();

  switchUser(user1);
}



function makeRepl(options) {
    var replContainer = jQuery("<div>");
    var codeContainer = jQuery("<div>");
    codeContainer.css({
      'float': 'left',
      'width': '45%',
      'border': '1px solid black'
    });
    var hasProgram = false;
    var initialCode = "";
    var writableCM;
    if(options.hasOwnProperty('initialUnwritable')) {
      var initialUnwritable = options.initialUnwritable;
      initialUnwritable.attr('disabled', 'true');
      codeContainer.append(initialUnwritable);
      initialCode = initialUnwritable.val();
      CodeMirror.fromTextArea(initialUnwritable[0]);
    }
    if(options.hasOwnProperty('initialWritable')) {
      var initialWritable = options.initialWritable;
      codeContainer.append(initialWritable);
      writableCM = CodeMirror.fromTextArea(initialWritable[0], {
            extraKeys: {
              "Shift-Enter": function(cm) {
                onProgramRun();
              }
            }
          });
      hasProgram = true;
    }
    var prompt = jQuery("<input type='text' id='prompt'>");
    var promptContainer = jQuery("<div id='prompt-container'>");
    promptContainer.append("<span>&gt;&nbsp;</span>");
    var interactions = jQuery("<div>");
    var output = jQuery("<div id='output'>");
    var breakButton = jQuery("<img id='break' src='break.png'>");
//    var resetButton = jQuery("<button id='reset'>Swab the decks</button>");
    var runButton = jQuery("<button id='run' type='submit'>RUN</button>");
    var clearDiv = jQuery("<div class='clear'>");
    var program = initialWritable;
    window.programCM = writableCM;

    prompt.css({
      'width': '95%'
    });

    interactions.css({
      'float': 'left',
      'margin-left': '2em',
      'width': '45%',
      'border': '1px solid black'
    });

    runButton.css({
      'float': 'right'
    });
    codeContainer.prepend(runButton);
    replContainer.append(codeContainer);
    promptContainer.append(prompt);
    interactions.append(output).append(promptContainer);
    replContainer.append(interactions).append(breakButton).append(clearDiv);

    programCM.refresh();

    var write = function(dom) {
        output.append(dom);
        output.get(0).scrollTop = output.get(0).scrollHeight;
    };

    var clear = function() {
      allowInput(prompt, true)();
      if(hasProgram) { allowInput(program, false)(); }
    };

    var onBreak = function() { 
        repl.requestBreak(clear);
    };

    
    var allowInput = function(elt, clear) { return function() {
        if (clear) {
          elt.val('');
        }
        elt.removeAttr('disabled');
        elt.css('background-color', 'white');
        breakButton.hide();
    } };

    var onReset = function() { 
        repl.reset(function() {
                       output.empty();
                       clear();
                   });
    };      
       

    var onExpressionEntered = function(srcElt) {
        var src = srcElt.val();
        write(jQuery('<span>&gt;&nbsp;</span>'));
        write(jQuery('<span>').append(src));
        write(jQuery('<br/>'));
        jQuery(srcElt).val("");
        srcElt.attr('disabled', 'true');
        srcElt.css('background-color', '#eee');
        breakButton.show();
        repl.compileAndExecuteProgram('interactions',
                                      src, 
                                      clear,
                                      onError);
    };

    var onProgramRun = function() {
        var src = initialCode + "\n" + (hasProgram ? programCM.getValue() : "");
        if(hasProgram) {
          program.attr('disabled', 'true');
          program.css('background-color', '#eee');
        }
        breakButton.show();
        output.empty();
        promptContainer.hide();
        promptContainer.fadeIn(100);
        repl.compileAndExecuteProgram('main', src, clear, onError);
    };


    var onError = function(err) {
        if (err.message) {
            write(jQuery('<span/>').css('color', 'red').append(err.message));
            write(jQuery('<br/>'));
        }
        clear();
    };
    

    breakButton.hide();
    breakButton.click(onBreak);
//    resetButton.click(onReset);
    prompt.attr('disabled', 'true');
    prompt.val('Please wait, initializing...');
    prompt.keypress(function(e) {
        if (e.which == 13 && !prompt.attr('disabled')) { 
            onExpressionEntered(prompt);
        }});

    runButton.click(function () { onProgramRun(); });
    if (hasProgram) {
      program.keypress(function(e) {
        if (e.which == 13 && e.shiftKey && !program.attr('disabled')) { 
          onProgramRun();
        }
      });
    }

    var afterReplSetup = function(theRepl) {
        repl = theRepl;
        prompt.val('');
        prompt.removeAttr('disabled');
        prompt.css('background-color', 'white');
    };

    var repl;
    plt.runtime.makeRepl({
      prettyPrint: function(result) {
        if (result.hasOwnProperty('_constructorName')) {
          switch(result._constructorName.val) {
            case 'p-num': 
            case 'p-bool':
            case 'p-str':
              write(jQuery("<span>").append(result._fields[2]).append("<br/>"))
              return true;       
            case 'p-nothing':
              return true;
            default:
              return false;
          }
        } else {
          console.log(result);
          return false;
        }
      },
      write: write,
      // TODO(joe): It's unfortunate that naming is by path here
      language: "root/src/lang/pyret-lang-whalesong.rkt"
    }, afterReplSetup);

    return replContainer;
}

