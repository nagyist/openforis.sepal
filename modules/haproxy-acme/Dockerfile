FROM haproxy:2.9-alpine

ENV MODULE_NAME haproxy-acme

USER root
RUN apk update && apk add \
    git \
    curl \
    openssl \
    socat \
    sudo \
    gettext \
    supervisor \
    busybox-suid

ADD modules/${MODULE_NAME}/setup.sh /usr/local/bin/
RUN chmod 775 /usr/local/bin/setup.sh && setup.sh

ADD modules/${MODULE_NAME}/start.sh /usr/local/bin/start.sh
RUN chmod 775 /usr/local/bin/start.sh

ADD modules/${MODULE_NAME}/issue-cert.sh /usr/local/bin/issue-cert
RUN chmod 775 /usr/local/bin/issue-cert

ADD modules/${MODULE_NAME}/supervisord.conf /etc/supervisor/supervisord.conf
ADD modules/${MODULE_NAME}/haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/usr/local/bin/start.sh"]
