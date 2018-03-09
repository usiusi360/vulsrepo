package main

import (
	"bufio"
	"crypto/md5"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/user"
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
	ServerIP    string
	ServerSSL   string
	ServerCert  string
	ServerKey   string
}

type AuthConfig struct {
	AuthFilePath string
	Realm        string
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
	var m bool
	var c, r, u string
	uc, err := user.Current()
	if err != nil {
		log.Fatal("Error: get HomeDir: ", err)
	}

	flag.BoolVar(&m, "m", false, "make AuthFile")
	flag.StringVar(&c, "c", uc.HomeDir+"/.htdigest", "AuthFile Path")
	flag.StringVar(&r, "r", "vulsrepo_local", "realm")
	flag.StringVar(&u, "u", "vuls", "login user")
	flag.Parse()

	if m == true {
		createAuthfile(c, r, u)
	} else {
		startServer()
	}
}

func createAuthfile(c string, r string, u string) {
	var pass string
	fmt.Printf("Password: ")
	fmt.Scan(&pass)
	fmt.Println("AuthFile Path\t: ", c)
	fmt.Println("realm\t\t: ", r)
	fmt.Println("login user\t: ", u)

	f, err := os.OpenFile(c, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		log.Fatal("Error: File Open: ", err)
	}
	defer f.Close()
	var writer *bufio.Writer
	writer = bufio.NewWriter(f)

	h := createMD5(u, r, pass)
	if _, err := writer.WriteString(u + ":" + r + ":" + h + "\n"); err != nil {
		log.Fatal("Error: File Write: ", err)
	}
	writer.Flush()
	log.Println("Create Success")
}

func createMD5(user string, realm string, passwd string) string {
	d := []byte(user + ":" + realm + ":" + passwd)
	return fmt.Sprintf("%x", md5.Sum(d))
}

func startServer() {
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
	if config.Server.ServerSSL == "yes" {    
		log.Println("Start: SSL Listening port: " + config.Server.ServerIP+":"+config.Server.ServerPort)
		err := http.ListenAndServeTLS(config.Server.ServerIP+":"+config.Server.ServerPort, config.Server.ServerCert, config.Server.ServerKey, nil)
		if err != nil {
			log.Fatal("Error: ListenAndServeTLS: ", err)
		}
	} else {
		log.Println("Start: Listening port: " + config.Server.ServerIP+":"+config.Server.ServerPort)
		err := http.ListenAndServe(config.Server.ServerIP+":"+config.Server.ServerPort, nil)
		if err != nil {
			log.Fatal("Error: ListenAndServe: ", err)
		}
	}
}

func loadConfig() {
	fpath, _ := (os.Executable())
	_, err := toml.DecodeFile(filepath.Dir(fpath)+"/vulsrepo-config.toml", &config)
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

        if config.Server.ServerSSL == "yes" {
                if _, err := os.Stat(config.Server.ServerCert); err != nil {
                        log.Println("Error: serverCertPath not access: ", config.Server.ServerCert)
                        flag = true
                } else {
                        log.Println("INFO: serverCertPath Load: ", config.Server.ServerCert)
                }

                if _, err := os.Stat(config.Server.ServerKey); err != nil {
                        log.Println("Error: serverKeyPath not access: ", config.Server.ServerKey)
                        flag = true
                } else {
                        log.Println("INFO: serverKeyPath Load: ", config.Server.ServerKey)
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

func accessAuth(rw http.ResponseWriter, req *auth.AuthenticatedRequest) {
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
