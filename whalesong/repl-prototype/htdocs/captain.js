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

function Review(by, content) {
  return {
    by: by,
    content: content
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
    var t = jQuery("<textarea class='code'>");
    var b = jQuery("<button>Submit</button>");
    b.click(function() {
      userNode.nodeTask.work = t.val();
      taskDone(userNode);
    });
    t.val(task.work);
    d.append(t).append("<br/>").append(b);
    return d;
});

var exampleTaskSpec = TaskSpec("exampleTaskSpec",
      function(work) {
        return Task(exampleTaskSpec, false, work);
      },
      "Example data for file system",
      function(userNode, task) {
        var d = jQuery("<div>");
        var textDefs = jQuery("<textarea class='code'>");
        textDefs.attr('disabled', true);
        var textWork = jQuery("<textarea class='code'>");
        textWork.val(task.work);
        var b = jQuery("<button>Submit</button>");

        var reviewsList = jQuery("<ul>");
        task.reviews.forEach(function(review) {
          var reviewItem = jQuery("<li>");
          var reviewMsg = review.content.good ? "Looks good!" : "Not yet.";
          reviewItem.append(jQuery("<span>(" + reviewMsg + ")</span>"));
          reviewItem.append(jQuery("<br/>"));
          reviewItem.append(jQuery("<textarea disabled='disabled'>" + review.content.comments + "</textarea>"));
          reviewsList.append(reviewItem);
        });

        b.click(function() {
          userNode.nodeTask.work = textWork.val();
          taskDone(userNode);
        });
        textDefs.val(userNode.user.nodes["dd"].nodeTask.work);
        d.append(reviewsList).append(textDefs).append("<br/>").append(textWork).append("<br/>").append(b);
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
        textToReview.attr('disabled', true);
        var textReview = jQuery("<textarea class='code'>");
        textReview.val(task.work.review.content.comments);

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
        d.append(textToReview).append("<br/>").append(textReview).append("<br/>").append(okDiv).append("<br/>").append(b);
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
    jQuery(".stage").removeClass("completed");
    jQuery(".stage").removeClass("blocked");
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
    if (reviews.length > 0) {
      var reviewBang = jQuery("<div>" + reviews.length + "</div>");
      reviewBang.css({
        'font-weight': 'bold',
        'position': 'relative',
        'bottom': '0px',
        'right': '0',
        'margin': '5px',
        'color': 'white',
        'background-color': 'red',
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
    reviewTest();
});

function reviewTest() {
  var $ = jQuery;
  $("#dd").click();
  $("#contents .code").val("data File:\n  | file(name, size) end");
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

