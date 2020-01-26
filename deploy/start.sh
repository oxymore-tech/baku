#!/usr/bin/env bash

BASEDIR=$(dirname "$0")

docker-compose -p baku --project-directory ${BASEDIR}/.. -f ${BASEDIR}/docker-compose.yml up -d $*
