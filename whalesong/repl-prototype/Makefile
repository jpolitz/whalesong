pyret:
	raco make write-runtime.rkt
	racket write-runtime.rkt --root-collection pyret --language-collection pyret lang/pyret-lang-whalesong.rkt
	raco make server.rkt

run:
	racket server.rkt --root-collection pyret

run-production:
	racket server.rkt --root-collection pyret --listen
