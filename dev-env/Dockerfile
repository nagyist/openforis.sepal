FROM debian:bookworm

SHELL ["/bin/bash", "-c"]

ARG DEBIAN_FRONTEND=noninteractive
ENV PROJECT_DIR /usr/local/src/sepal
ENV NODE_MAJOR=22
ARG DOCKER_COMPOSE_VERSION=v2.34.0
ARG JAVA_VERSION=11.0.11.hs-adpt
ARG GRADLE_VERSION=6.9.1

# Update and install base packages

RUN apt-get update && apt-get install -y \
    apt-utils \
    curl \
    build-essential \
    cmake \
    ca-certificates \
    gdal-bin \
    git \
    gnupg \
    graphviz \
    inetutils-ping \
    lsb-release \
    nano \
    ncdu \
    unzip \
    zip

# Setup git aliases
RUN git config --global alias.st status \
    && git config --global alias.ci commit \
    && git config --global alias.br branch \
    && git config --global alias.co checkout \
    && git config --global alias.unstage 'reset HEAD --' \
    && git config --global alias.last 'log -1 HEAD'

# Install docker-cli

RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

RUN echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update && apt-get install -y docker-ce-cli

# Install docker compose

RUN mkdir -p /usr/local/lib/docker/cli-plugins
RUN curl -SL https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
RUN chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Install node.js

RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y

# Install global npm packages

RUN npm install -g madge npm-check-updates wscat touch

# Set bash prompt

RUN echo "export PS1='[\[\033[1;35m\]\u@dev-env\[\033[0m\]:\w]\$ '" >> /root/.bashrc

# Add shell script to path

ADD sepal.sh /usr/local/bin/sepal
RUN chmod +x /usr/local/bin/sepal

# Add source code

ADD ./package.json ${PROJECT_DIR}/dev-env/
ADD ./package-lock.json ${PROJECT_DIR}/dev-env/
ADD ./src ${PROJECT_DIR}/dev-env/src/
ADD ./config ${PROJECT_DIR}/dev-env/config/

WORKDIR $PROJECT_DIR/dev-env/
RUN npm install

# Install Java and Gradle

ENV SDKMAN_DIR=/usr/local/lib/sdkman
RUN curl -s https://get.sdkman.io | bash && \
    source "${SDKMAN_DIR}/bin/sdkman-init.sh" && \
    yes | sdk install java ${JAVA_VERSION} && \
    sdk install gradle ${GRADLE_VERSION}
RUN source "${SDKMAN_DIR}/bin/sdkman-init.sh" && \    
    ln -s "$(which java)" /usr/local/bin/java && \
    ln -s "$(which gradle)" /usr/local/bin/gradle && \
    JAVA_HOME=$(sdk home java current) && \
    sed -i 's/jdk.tls.disabledAlgorithms=.*/jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, /' "$JAVA_HOME/conf/security/java.security"

WORKDIR $PROJECT_DIR
