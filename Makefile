.PHONY: run stop remove

run:
	docker run --name lgtm -d -p 3000:3000 -p 9090:9090 -p 4317:4317 -p 4318:4318 --rm \
	    -v "$(PWD)"/lgtm/grafana:/data/grafana \
	    -v "$(PWD)"/lgtm/prometheus:/data/prometheus \
	    -v "$(PWD)"/lgtm/loki:/data/loki \
	    -e GF_PATHS_DATA=/data/grafana \
	    docker.io/grafana/otel-lgtm:0.8.1

stop:
	docker stop lgtm

remove:
	docker rm lgtm
