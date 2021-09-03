package main

// Import our dependencies. We'll use the standard HTTP library as well as the gorilla router for this app
import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email string
	Token string `gorm:"index"`
}

type Task struct {
	gorm.Model
	Text   string
	Prog   string
	UserID string
	User   *User
}

const (
	pref = "/robot"
	addr = ":10333"
)

func LogAll(orig http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		orig.ServeHTTP(w, r)
		log.Println("Served", r.URL)
	})
}

func main() {
	log.SetFlags(log.Lshortfile | log.Lmicroseconds)
	log.Println("Starting")

	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&User{})
	db.AutoMigrate(&Task{})

	r := mux.NewRouter()
	r.StrictSlash(true)
	r.PathPrefix(pref + "/static/").Handler(http.StripPrefix(pref+"/static/", http.FileServer(http.Dir("../build/static/"))))

	jwtMiddleware := makeJwtMiddleware()
	r.Handle("/tasks", jwtMiddleware.Handler(http.HandlerFunc(TasksHandler))).Methods("GET")
	// r.Handle("/products/{slug}/feedback", jwtMiddleware.Handler(AddFeedbackHandler)).Methods("POST")

	r.Handle(pref, http.StripPrefix(pref, http.FileServer(http.Dir("../build"))))

	// For dev only - Set up CORS so React client can consume our API
	corsWrapper := cors.New(cors.Options{
		AllowedMethods: []string{"GET", "POST"},
		AllowedHeaders: []string{"Content-Type", "Origin", "Accept", "*"},
	})

	// r.Use(LogAll)
	log.Println("Serving on", addr, pref)
	http.ListenAndServe(addr, corsWrapper.Handler(LogAll(r)))
}

func TasksHandler(w http.ResponseWriter, r *http.Request) {
	log.Println(r.Context().Value("user"))
}
