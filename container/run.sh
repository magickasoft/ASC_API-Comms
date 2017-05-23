#!/bin/bash
SRV_NAME="api-comms"
docker stop $SRV_NAME
docker rm $SRV_NAME
docker run -d --name $SRV_NAME --link mongodb:mongodb asc/$SRV_NAME
