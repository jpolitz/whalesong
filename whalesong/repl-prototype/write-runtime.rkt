#lang racket


(require racket/path
         racket/runtime-path
         "../make/make-structs.rkt"
         "../js-assembler/package.rkt"
         "../parameters.rkt"
         (for-syntax racket/base))

(provide write-repl-runtime-files)

(define-runtime-path collects-path (build-path "htdocs" "collects"))


;; write-repl-runtime-files: -> void
;; Write out the support library necessary to run Whalesong programs.
;; Includes the basic runtime as well as the language.
(define (write-repl-runtime-files language-path)

  (unless (directory-exists? collects-path)
    (make-directory collects-path))
  
  
  (define written-js-paths '())
  (define module-mappings (make-hash))
  
  
  
  (define make-output-js-filename
    (lambda (module-name)
      (define result
        (build-path collects-path
                    (string-append
                     (regexp-replace #rx"[.](rkt|ss)$" (symbol->string module-name) "")
                     ".js")))
      (set! written-js-paths (cons result written-js-paths))
      (fprintf (current-report-port)
               (format "Writing program ~s\n" result))
      
      (when module-name
        (hash-set! module-mappings module-name result))
      result))
  
  
  (call-with-output-file* (make-output-js-filename 'runtime)
                          (lambda (op)
                            (display (get-runtime) op))
                          #:exists 'replace)
  
  (call-with-output-file* (make-output-js-filename 'library)
                          (lambda (op)
                            (display (get-inert-code (make-ModuleSource 
                                                      (normalize-path language-path))
                                                     make-output-js-filename)
                                     op))
                          #:exists 'replace)
  
  
  ;(for/hash ([(key path) module-mappings])
  ;  (values key (path->string (file-name-from-path path))))
  
  )


(module+ main 
  (command-line
    #:once-each
    ("--root-dir" path "Use the given root directory"
     (current-root-path (simple-form-path path)))
    ("--language-path" path "Use the given path as the language context for the Whalesong browser runtime"
      (write-repl-runtime-files (simple-form-path path)))))

