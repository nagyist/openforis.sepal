FROM haproxy:2.8

EXPOSE 80 443

ENV MODULE_NAME haproxy
USER root

RUN apt-get update && apt-get install -y gettext

ADD modules/${MODULE_NAME}/config /config
ADD modules/${MODULE_NAME}/script/init_container.sh /usr/local/bin/init_container

RUN chmod 500 /usr/local/bin/init_container && \
    chmod -R 400 /config

CMD ["/usr/local/bin/init_container"]
