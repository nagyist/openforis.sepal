#!/bin/bash
set -e

# To use docker-cli as jenkins from within the container
# we create a docker group with same gid as on the host
# and assign jenkins to that group
DOCKER_GROUP=$(stat -c %g /var/run/docker.sock)
addgroup -g $DOCKER_GROUP docker
adduser jenkins docker

# Setup GitHub SSH identity file
SSH_DIR=/var/jenkins_home/.ssh
ln -s /var/lib/jenkins/.ssh $SSH_DIR
IDENTITY_FILE=$SSH_DIR/id_rsa
if ! test -f $IDENTITY_FILE; then
    sudo -u jenkins ssh-keygen -t rsa -b 4096 -C "GitHub key" -f $IDENTITY_FILE -N ""
    chmod 400 $IDENTITY_FILE
fi

# Setup jobs
sudo -u jenkins rsync -a /var/lib/jenkins/jobs/* /var/jenkins_home/jobs/

# Execute the parent image Entrypoint
exec sudo --preserve-env --set-home --user jenkins /sbin/tini -s -- /usr/local/bin/jenkins.sh