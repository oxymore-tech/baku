#!/usr/bin/env bash

BASEDIR=$(dirname "$0")

docker-compose -p baku --project-directory ${BASEDIR} -f ${BASEDIR}/deploy/docker-compose-dev.yml up $*
