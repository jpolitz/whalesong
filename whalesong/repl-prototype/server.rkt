#lang racket/base

(require json
         file/gzip
         racket/runtime-path
         racket/port
         racket/path
         racket/match
         racket/pretty
         web-server/servlet-env
         web-server/servlet
         "repl-compile.rkt"
         "../parameters.rkt"
         (for-syntax racket/base))

(provide start-server)

(define-runtime-path htdocs (build-path "htdocs"))

(define language 
  'pyret/lang/pyret-lang-whalesong
  ;'whalesong/wescheme/lang/semantics
  ;'whalesong/simply-scheme/semantics
  )

;; make-port-response: (values response/incremental output-port)
;; Creates a response that's coupled to an output-port: whatever you
;; write into the output will be pushed into the response.
(define (make-port-response #:mime-type (mime-type #"application/octet-stream")
                            #:with-gzip? (with-gzip? #t)
                            #:with-cors? (with-cors? #f))
  (define headers 
    (filter values 
            (list (if with-gzip?
                      (header #"Content-Encoding" #"gzip")
                      #f)
                  (cond [(not with-cors?) 
                         #f]
                        [(bytes? with-cors?)
                         (header #"Access-Control-Allow-Origin" with-cors?)]
                        [(eq? with-cors? #t)
                         (header #"Access-Control-Allow-Origin" #"*")]
                        [else
                         (raise-argument-error 'make-port-response
                                               "byte string or boolean"
                                               with-cors?)]))))
  (define-values (in out) (make-pipe))
  (values (response
             200 #"OK"
             (current-seconds)
             mime-type
             headers
             (lambda (op)
               (cond
                [with-gzip?
                 (gzip-through-ports in op #f (current-seconds))]
                [else
                 (copy-port in op)])))
            out))


(define (lookup-binding req id)
  (if (exists-binding? id (request-bindings req))
      (extract-binding/single id (request-bindings req))
      #f))
  

(define (start req)
  (define-values (response op) 
    (make-port-response #:mime-type #"text/json" #:with-cors? #t))
  (define source-name (lookup-binding req 'name))
  (define mname (lookup-binding req 'mname))
  (define lang (lookup-binding req 'lang))
  (define options (string->jsexpr (extract-binding/single 'options (request-bindings req))))
  (define src (extract-binding/single 'src (request-bindings req)))
  (define as-mod? (match (extract-bindings 'm (request-bindings req))
                    [(list (or "t" "true"))
                     #t]
                    [else #f]))
  ;; Compile the program here...
  (with-handlers ([exn:fail? (lambda (exn)
                               (write-json (hash 'type "error"
                                                 'message (exn-message exn))
                                           op))])
    (define assembled-codes (whalesong-compile source-name src #:lang language #:options options))
    (write-json (hash 'type "repl"
                             'compiledCodes assembled-codes)
                       op))
  (close-output-port op)
  response)
  



(define (start-server #:port [port 8000]
                      #:listen-ip [listen-ip "127.0.0.1"])
    (thread (lambda ()
              (printf "starting web server on port ~s\n" port)
              (when (not listen-ip)
                (printf "listening on all addresses \n"))
              (serve/servlet start 
                             #:listen-ip listen-ip
                             #:servlet-path "/compile"
                             #:extra-files-paths (list htdocs)
                             #:launch-browser? #f
                             #:port port))))

(module+ main
  (define current-port (make-parameter 8080))
  (define current-listen-ip (make-parameter "127.0.0.1"))
  (require racket/cmdline)
  (void (command-line
         #:once-each 
         [("--root-dir") root "Root directory to look for included files, default (current-directory)"
          (current-root-path (simple-form-path root))]
         [("-p" "--port") p "Port (default 8000)" 
          (current-port (string->number p))]
         [("-l" "--listen")
          "Listen on all ips (defaults to just 127.0.0.1)" 
          (current-listen-ip #f)]))
  (sync (start-server #:port (current-port)
                      #:listen-ip (current-listen-ip))))
  

