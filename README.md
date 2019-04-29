# backup-docker [![Build Status](https://travis-ci.org/tlaanemaa/backup-docker.svg?branch=master)](https://travis-ci.org/tlaanemaa/backup-docker) [![Coverage Status](https://coveralls.io/repos/github/tlaanemaa/backup-docker/badge.svg)](https://coveralls.io/github/tlaanemaa/backup-docker)
_A simple command line tool to backup and restore docker container inspection results and their volumes_

The main idea of this package is to make backing up and restoring docker containers as easy as possible while avoiding backing up information that we can easily reproduce. This is achieved by backing up only the container's inspection files and the contents of their volumes. The inspection files can then be later used to recreate the same container, with the same settings, and the volume backups can be used to restore the contents of that container's volumes. This way we can have a backup of everything we would need to restore the container, while not bloating our backup files. All this of course assumes that the image is backed up elsewhere, as it usually is, in a separate repository or DockerHub.

## Installation
_Requires [node.js](https://nodejs.org/en/download/) v8.0 or later_
```
npm install -g backup-docker
```

## Usage
There are 2 main commands:
- `backup` - Creates a backup of the given container, or all if none is specified, and it's volumes
- `restore` - Restores containers and volumes from existing backup files. 

When run, two directories are created if not already present in the target directory (defaults to current working directory):
- `containers` - Used to store container inspection files as .json files
- `volumes` - Used to store the contents of volumes as .tar files

_When run with `restore` command, backup-docker will expect these folders to exist in the target directory, if they don't, it will create them_

## Examples
- `backup-docker backup` - Will backup all containers in the docker instance, and their volumes
- `backup-docker restore` - Will restore all containers in containers folder, and their volumes
- `backup-docker backup banana` - Will backup only the container named "banana" and all of it's volumes
- `backup-docker restore banana mango` - Will restore only the containers named "banana" and "mango" and all of their volumes
- `backup-docker restore banana --only=containers` - Will restore only the container named "banana" and not it's volumes
- `backup-docker restore banana --only=volumes` - Will restore the volumes attached to the container named "banana" but not the container itself. The container itself must already exist in the docker instance

## All options
- `-v, --version` - output the version number
- `-d, --directory [directory]` - directory name to save to or look for container backups (default: current working directory)
- `-s, --socket-path [socket-path]` - docker socket path
- `--only-containers` - backup/restore containers only
- `--only-volumes` - backup/restore volumes only. If used with the restore command then the container is expected to already exist
- `-h, --help` - output usage information
