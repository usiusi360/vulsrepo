package models

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
