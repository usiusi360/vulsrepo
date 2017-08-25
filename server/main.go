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
)

type Config struct {
	Server ServerConfig
}

type ServerConfig struct {
	RootPath    string
	ResultsPath string
	ServerPort  string
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

	http.Handle("/", http.FileServer(http.Dir(config.Server.RootPath)))
	http.Handle("/results/", http.StripPrefix("/results/", http.FileServer(http.Dir(config.Server.ResultsPath))))
	http.HandleFunc("/getfilelist/", getfilelist)

	log.Println("Start: Listening port: " + config.Server.ServerPort)
	err := http.ListenAndServe(":"+config.Server.ServerPort, nil)
	if err != nil {
		log.Fatal("Error: ListenAndServe: ", err)
	}

}

func pathChk() {
	var flag bool = false
	if _, err := os.Stat(config.Server.RootPath); err != nil {
		log.Println("Error: RootPath not access: ", err)
		flag = true
	}

	if _, err := os.Stat(config.Server.ResultsPath); err != nil {
		log.Println("Error: ResultsPath not access : ", err)
		flag = true
	}

	if flag == true {
		log.Fatal("Error: Please see if the config setting is correct")
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

func getfilelist(rw http.ResponseWriter, req *http.Request) {
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
