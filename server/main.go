package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/BurntSushi/toml"
	auth "github.com/abbot/go-http-auth"
)

type Config struct {
	Server ServerConfig
	Auth   AuthConfig
}

type ServerConfig struct {
	RootPath    string
	ResultsPath string
	ServerPort  string
}

type AuthConfig struct {
	AuthFilePath    string
	Realm string
}

type Tree []interface{}

type Folder struct {
	IsFolder string        `json:"isFolder"`
	Title    string        `json:"title"`
	Children []interface{} `json:"children"`
}

type File struct {
	Title string `json:"title"`
	Url   string `json:"url"`
}

var config Config

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	loadConfig()
	pathChk()

	if config.Auth.AuthFilePath != "" {
		authenticator := auth.NewDigestAuthenticator(config.Auth.Realm, getAuthFile(config.Auth.AuthFilePath))
		http.HandleFunc("/", auth.JustCheck(authenticator, handleFileServer(config.Server.RootPath, "/")))
		http.HandleFunc("/results/", auth.JustCheck(authenticator, handleFileServer(config.Server.ResultsPath, "/results/")))
		http.HandleFunc("/getfilelist/", authenticator.Wrap(accessAuth))
	} else {
		http.HandleFunc("/", handleFileServer(config.Server.RootPath, "/"))
		http.HandleFunc("/results/", handleFileServer(config.Server.ResultsPath, "/results/"))
		http.HandleFunc("/getfilelist/", accessDirect)
	}

	log.Println("Start: Listening port: " + config.Server.ServerPort)
	err := http.ListenAndServe(":"+config.Server.ServerPort, nil)
	if err != nil {
		log.Fatal("Error: ListenAndServe: ", err)
	}
}

func loadConfig() {
	fpath , _ := (os.Executable())
	_, err := toml.DecodeFile(filepath.Dir(fpath) + "/vulsrepo-config.toml", &config)
	if err != nil {
			_, err := toml.DecodeFile("./vulsrepo-config.toml", &config)
			if err != nil {
				log.Fatal("Error: Load Config: ", err)
			}
	}
}

func pathChk() {
	var flag bool = false
	if _, err := os.Stat(config.Server.RootPath); err != nil {
		log.Println("Error: RootPath not access: ", err)
		flag = true
	} else {
		log.Println("INFO: RootPath Load: ", config.Server.RootPath)
	}

	if _, err := os.Stat(config.Server.ResultsPath); err != nil {
		log.Println("Error: ResultsPath not access: ", err)
		flag = true
	} else {
		log.Println("INFO: ResultsPath Load: ", config.Server.ResultsPath)
	}

	if config.Auth.AuthFilePath != "" {
		if _, err := os.Stat(config.Auth.AuthFilePath); err != nil {
			log.Println("Error: AuthFilePath not access: ", config.Auth.AuthFilePath)
			flag = true
		} else {
			log.Println("INFO: AuthFilePath Load: ", config.Auth.AuthFilePath)
		}
	}

	if flag == true {
		log.Fatal("Error: Please see if the config setting is correct")
	}
}

func getAuthFile(filename string) auth.SecretProvider {
	return auth.HtdigestFileProvider(filename)
}

func handleFileServer(dir, prefix string) http.HandlerFunc {
    fs := http.FileServer(http.Dir(dir))
    realHandler := http.StripPrefix(prefix, fs).ServeHTTP
    return func(w http.ResponseWriter, req *http.Request) {
        log.Println(req.URL)
        realHandler(w, req)
    }
}

func accessAuth(rw http.ResponseWriter, req  *auth.AuthenticatedRequest) {
	getfilelist(rw)
}

func accessDirect(rw http.ResponseWriter, req *http.Request) {
	getfilelist(rw)	
}

func getfilelist(rw http.ResponseWriter) {
	result, err := getTree(config.Server.ResultsPath)
	if err != nil {
		log.Println("Error: getTree: ", err)
	}

	jsonBytes, err := json.Marshal(&result)
	if err != nil {
		log.Println("Error: JSON Marshal error: ", err)
	}
	rw.Header().Set("Content-Type", "application/json")
	fmt.Fprint(rw, string(jsonBytes))
}

func getTree(path string) (Tree, error) {
	var tree Tree

	if err := os.Chdir(path); err != nil {
		return tree, err
	}

	fis, err := ioutil.ReadDir(".")
	if err != nil {
		return tree, err
	}

	for _, fi := range fis {
		if fi.IsDir() {
			if fi.Name() == "current" {
				continue
			}
			var tmpFolder Folder
			tmpFolder.IsFolder = "true"
			tmpFolder.Title = fi.Name()
			childPath, _ := getTree(fi.Name())
			tmpFolder.Children = childPath
			tree = append(tree, tmpFolder)
			if err := os.Chdir("../"); err != nil {
				return tree, err
			}

		} else {
			r := regexp.MustCompile(`.json$`)
			if r.MatchString(fi.Name()) == false {
				continue
			}

			c, _ := os.Getwd()
			fullPath := filepath.Join(c, fi.Name())
			urlstr := strings.Replace(fullPath, config.Server.ResultsPath, "", 1)

			var tmpFile File
			tmpFile.Title = fi.Name()
			tmpFile.Url = urlstr
			tree = append(tree, tmpFile)
		}
	}
	return tree, nil
}
