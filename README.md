# backup-docker [![Build Status](https://travis-ci.org/tlaanemaa/backup-docker.svg?branch=master)](https://travis-ci.org/tlaanemaa/backup-docker) [![Coverage Status](https://coveralls.io/repos/github/tlaanemaa/backup-docker/badge.svg)](https://coveralls.io/github/tlaanemaa/backup-docker)
A simple command line tool to backup and restore docker container inspection results and their volumes

**work in progess**

The main idea of this package is to make backing up and restoring docker container as easy as possible while avoiding backing up information that we can easily reproduce. This is achieved by backing up only the container's inspection files and the contents of their volumes. The inspection files can then be later used to recreate the same container, with the same settings, and the volume backups can be used to restore the contents of that container's volumes.

## Installation
```
npm install -g backup-docker
```

## Usage
There are 2 main operations:
- `backup` - Creates a backup of the given container, or all if none is specified, and it's volumes
- `restore` - Restores containers and volumes from existing backup files. 

When ran, two directories are created if not already present in the target directory (defaults to current working directory):
- `containers` - Used to store container inspection files as .json files
- `volumes` - Used to store the contents of volumes as .tar files

_When ran with `restore` operation, backup-docker will expect these folders to exist in the target directory, if they don't, it will create them_

## Examples
- `backup-docker backup` - Will backup all containers in the docker instance, and their volumes
- `backup-docker restore` - Will restore all containers in containers folder, and their volumes.
- `backup-docker backup -c banana` - Will backup only the container named "banana" and all of it's volumes
- `backup-docker restore -c banana` - Will restore only the container named "banana" and all of it's volumes
- `backup-docker restore -c banana --only=containers` - Will restore only the container named "banana" and not it's volumes
- `backup-docker restore -c banana --only=volumes` - Will restore the volumes attached to the container named "banana" but not the container itself. The volumes will be taken from the backed up inspection file of the container

## All options
```
--operation enum            Operation to perform. Options: backup | restore                               
-c, --containers string[]   Optional names of the containers to backup or restore. Defaults to all        
                            containers                                                                    
-d, --directory string      Optional directory name to save to or look for container backups. Defaults to 
                            current working directory                                                     
-s, --socketPath string     Optional Docker socket path. Defaults to /var/run/docker.sock                 
-o, --only enum             Optional to indicate that only containers or volumes should be backed up or   
                            restored. Defaults to both. Options: containers | volumes                     
-h, --help                  Prints this help page  
```