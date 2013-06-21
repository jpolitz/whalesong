jQuery(document).ready(function() {
    "use strict";    

    var prompt = jQuery("#prompt");
    var container = jQuery("#prompt-container");
    var output = jQuery("#output");
    var breakButton = jQuery("#break");
    var resetButton = jQuery("#reset");

    var write = function(dom) {
        output.append(dom);
        output.append(container);
        output.get(0).scrollTop = output.get(0).scrollHeight;
    };

    var clear = function() {
      allowInput(prompt, true)();
      allowInput(program, false)();
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
       

    var onExpressionEntered = function(srcElt, showCode) {
        var src = srcElt.val();
        if (showCode) {
          write(jQuery('<span>&gt;&nbsp;</span>'));
          write(jQuery('<span>').append(src));
          write(jQuery('<br/>'));
          jQuery(srcElt).val("");
        }
        srcElt.attr('disabled', 'true');
        srcElt.css('background-color', '#eee');
        breakButton.show();
        repl.compileAndExecuteProgram('interactions',
                                      src, 
                                      clear,
                                      onError);
    };


    var onError = function(err) {
        if (err.message) {
            write(jQuery('<span/>').css('color', 'red').text(err.message));
            write(jQuery('<br/>'));
        }
        clear();
    };
    

    breakButton.hide();
    breakButton.click(onBreak);
    resetButton.click(onReset);
    prompt.attr('disabled', 'true');
    prompt.val('Please wait, initializing...');
    prompt.keypress(function(e) {
        if (e.which == 13 && !prompt.attr('disabled')) { 
            onExpressionEntered(prompt, true);
        }});

    var program = jQuery('#program');
    jQuery('#run').click(function () { onExpressionEntered(program); });
    program.keypress(function(e) {
      if (e.which == 13 && e.shiftKey && !program.attr('disabled')) { 
        onExpressionEntered(program);
      }
    })

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
});
