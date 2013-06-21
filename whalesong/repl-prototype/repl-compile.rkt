#lang racket/base

(provide whalesong-compile)
(require
 "../parser/parse-bytecode.rkt"
 (only-in "../compiler/compiler.rkt" compile-for-repl)
 "../js-assembler/assemble.rkt"       
 racket/match
 (only-in pyret pyret-read-syntax))

(define this-namespace (make-base-empty-namespace))

;; Somewhat magical.
;; See: http://lists.racket-lang.org/users/archive/2013-February/056664.html.
(define make-fresh-namespace 
  (eval '(lambda ()
           (variable-reference->empty-namespace
            (#%variable-reference)))
        (make-base-namespace)))


;; make-repl-namespace: [module-path] -> namespace
;; Creates a clean namespace for the given module path.
;;
;; Note that we cache prior instantiations of the language
;; to speed up construction of the namespace,
;; so don't let people call make-repl-namespace with arbitrary values.
(define (make-repl-namespace [language-module-path 'racket/base])
  (parameterize ([current-namespace this-namespace])
    (dynamic-require language-module-path 0))
  (define ns (make-fresh-namespace))
  (parameterize ([current-namespace ns])
    (namespace-attach-module this-namespace language-module-path)  
    ;; NOTE(joe): doing this causes a core dump?  Investigate someday
;;    (namespace-attach-module ns language-module-path)  
    (namespace-require/copy language-module-path))
  ns)


;; repl-compile: any [#:lang module-path] -> compiled-bytecode
;; Compiles the given body in a toplevel context under the given language.
;; Compilation creates a fresh namespace each time to avoid one compilation
;; affecting the other.
;;
;; Note however, that the languages have to make sure not to maintain compilation
;; state themselves, since we reuse the language module to improve repl construction
;; time.
(define (repl-compile body #:lang [language-module-path 'racket/base])
  (parameterize ([current-namespace (make-repl-namespace language-module-path)])
    (compile body)))


(define (repl-read-syntax _ in)
  (pyret-read-syntax _ in))

(define (repl-reader-for language)
  (match language
    ['pyret/lang/pyret-lang-whalesong repl-read-syntax]
    ['racket/base read-syntax]))

;; Compiles code from str
(define (whalesong-compile source-name src #:lang [lang 'racket/base])
  (define ip (open-input-string src))
  (port-count-lines! ip)
  (define assembled-codes
    (let loop () 
      (define sexp ((repl-reader-for lang) source-name ip))
      (cond [(eof-object? sexp)
             '()]
            [else
             (define raw-bytecode (repl-compile sexp #:lang lang))
             (define op (open-output-bytes))
             (write raw-bytecode op)
             (define whalesong-bytecode (parse-bytecode (open-input-bytes (get-output-bytes op))))
             (define compiled-bytecode (compile-for-repl whalesong-bytecode))
             (define assembled-op (open-output-string))
             (define assembled (assemble/write-invoke compiled-bytecode assembled-op 'with-preemption))
             (cons (get-output-string assembled-op) (loop))])))
  assembled-codes)



;(for ([i 10])
;  (time (repl-compile '(* x 3) #:lang 'whalesong/lang/whalesong))
;  (time (repl-compile '(/ x 3) #:lang 'whalesong/lang/whalesong)))
