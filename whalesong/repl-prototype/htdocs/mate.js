"use strict";

function User(name, drills) {
    return {
        name: name,
        drills: drills
    };
}

function Exercise(spec, problem, done, correct) {
    return {
        spec: spec,
        problem: problem,
        done: done,
        correct: correct
    };
}

function ExerciseSpec(create, view) {
    return {
        create: create,
        view: view
    };
}

function Drill(title, exercises, failCount) {
    return {
        title: title,
        exercises: exercises,
        failCount: failCount
    };
}

function UserDrill(drill, exercises, index) {
    return {
        drill: drill,
        exercises: exercises,
        index: index
    };
}

function createUserDrill(drill) {
    return UserDrill(drill, drill.exercises.map(function (exerciseSpec) {
        return exerciseSpec.create();
    }), 0, 0);
}

var user1 = User("Henry", []);
var user2 = User("Dancing Queen", []);
var user3 = User("Edward Teach", []);
var allUsers = [user1, user2, user3];
var currentUser = user1;

function makeEvaluator(source, output) {
    var container = jQuery("<div>");
    var runButton = jQuery("<button id='run' type='submit'>Run It</button>");
    var breakButton = jQuery("<img id='break' src='break.png'>");
    container.append(source).append(runButton).append(output);

    var write = function(dom) {
        output.append(dom);
        output.get(0).scrollTop = output.get(0).scrollHeight;
    };

     var clear = function() {
      
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
    
    var onError = function(err) {
        if (err.message) {
            write(jQuery('<span/>').css('color', 'red').append(err.message));
            write(jQuery('<br/>'));
        }
        clear();
    };
    
    var onRun = function() {
        var src = source.val();
        source.attr('disabled', 'true');
        source.css('background-color', '#eee');
        
        breakButton.show();
        output.empty();
        repl.compileAndExecuteProgram('main', src, clear, onError);
    };

    runButton.click(function () { onRun(); });

    var afterReplSetup = function(theRepl) {
        repl = theRepl;
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

    return container;
}


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

    jQuery("#drills").empty();
    
    drawDrills(currentUser.drills);
}

function drawDrills(drills, current) {
    drills.forEach(function (drill) {
        var drillDiv = jQuery("<div class='drill'>");
        var done = drill.exercises.filter(function (e) { return e.done; });
        var failed = drill.exercises.filter(function (e) { return e.done && !e.correct; });

        var maxFail = drill.drill.failCount;
        var failedMessage = maxFail > 0 ?
            "<br/>(" + failed.length + "/" + maxFail + " failed)" : "";
        drillDiv.html(drill.drill.title + "<br/>" + done.length + "/" +
                      drill.exercises.length + failedMessage);

        if (done.length == drill.exercises.length) {
            drillDiv.addClass("completed");
        }

        drillDiv.click(function () {
            jQuery(".drill").removeClass("active");
            drillDiv.addClass("active");
            drawDrill(drill);
        });

        if (current && drill === current) {
            drillDiv.addClass("active");
        }
        
        jQuery("#drills").append(drillDiv);
    });
}

function drawDrill(userDrill) {
    jQuery("#contents").empty();
    if (userDrill.index >= userDrill.exercises.length) {
        return;
    }
    var currentExercise = userDrill.exercises[userDrill.index];
    var exerciseDiv = currentExercise.spec.view(userDrill, currentExercise);
    jQuery("#contents").append(exerciseDiv);
}

// No wheels were invented in the writing of this code
// http://stackoverflow.com/questions/6274339/
//        how-can-i-shuffle-an-array-in-javascript
function shuffle(o) {
    for(var j, x, i = o.length; i;
        j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function mathBinOpExerciseSpec(pyretOp, jsOp, jsInverseOp) {
    var spec = ExerciseSpec(function () {
    var n1 = Math.floor(Math.random() * 10+1);
    var n2 = Math.floor(Math.random() * 10+1);
    return Exercise(spec,
                    {expression: n1 + "."+pyretOp+"(" + n2 + ")",
                     answer: jsOp(n1,n2) + "",
                     choices: [n1+"",jsOp(n1,n2) + "" , (n1 + "") + (n2 + ""),
                               (n2 + "") + (n1 + ""), jsInverseOp(n1,n2) + ""]},
                   false, false);
}, function (userDrill, exercise) {
    var text = jQuery("<textarea>");
    text.val(exercise.problem.expression);
    var output = jQuery("<span class='output'>");
    var evaluator = makeEvaluator(text, output);

    var container = jQuery("<div>");
    var instructions = jQuery("<p>What does the following Pyret expression evaluate to?</p>");
    container.append(instructions).append(evaluator);
    // copy and shuffle
    shuffle(exercise.problem.choices.slice(0)).forEach(function (choice) {
        var button = jQuery("<button>" + choice + "</button>");
        button.click(function () {
            if (choice === exercise.problem.answer) {
                exercise.correct = true;
            } else {
                exercise.correct = false;
            }
            exercise.done = true;
            userDrill.index++;

            var failed = userDrill.exercises.filter(function (e) { return e.done && !e.correct}).length;
            if (failed > userDrill.drill.failCount) {
                // reset drill
                userDrill.exercises = userDrill.drill.exercises.map(function (e) {
                    return e.create();
                });
                userDrill.index = 0;
            }
            jQuery("#drills").empty();
            drawDrills(currentUser.drills, userDrill);
            drawDrill(userDrill);
        });
        container.append(button);
    });

    return container;
});
    return spec;
}

var plusExpressionExerciseSpec = mathBinOpExerciseSpec("plus",
                                                       function(a,b) {return a+b;},
                                                       function(a,b) {return a-b;}
                                                      );
var plusExpressionDrill = Drill("Addition Exercises",
                                [plusExpressionExerciseSpec,
                                 plusExpressionExerciseSpec,
                                 plusExpressionExerciseSpec,
                                 plusExpressionExerciseSpec,
                                 plusExpressionExerciseSpec,
                                 plusExpressionExerciseSpec], 2);

var minusExpressionExerciseSpec = mathBinOpExerciseSpec("minus",
                                                       function(a,b) {return a-b;},
                                                       function(a,b) {return a+b;}
                                                      );
var minusExpressionDrill = Drill("Subtraction Exercises",
                                [minusExpressionExerciseSpec,
                                 minusExpressionExerciseSpec,
                                 minusExpressionExerciseSpec,
                                 minusExpressionExerciseSpec,
                                 minusExpressionExerciseSpec,
                                 minusExpressionExerciseSpec], 2);

user1.drills.push(createUserDrill(plusExpressionDrill));
user1.drills.push(createUserDrill(minusExpressionDrill));

$(function () {
    draw();
});
