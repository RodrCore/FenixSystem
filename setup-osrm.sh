#!/bin/bash
set -e

DIR=~/osrm-bolivia
mkdir -p $DIR
cd $DIR

echo "📥 Descargando mapa de Bolivia..."
[ ! -f bolivia-latest.osm.pbf ] && \
  wget https://download.geofabrik.de/south-america/bolivia-latest.osm.pbf

echo "🔧 Extract..."
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/bolivia-latest.osm.pbf

echo "🔧 Partition..."
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/bolivia-latest.osrm

echo "🔧 Customize..."
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/bolivia-latest.osrm

echo "🚀 Levantando servidor OSRM..."
docker rm -f osrm-bolivia 2>/dev/null || true
docker run -d --name osrm-bolivia \
  -p 5000:5000 \
  --restart=always \
  -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend \
  osrm-routed --algorithm mld /data/bolivia-latest.osrm

echo "✅ OSRM corriendo en http://localhost:5000"
echo ""
echo "Probar:"
echo 'curl "http://localhost:5000/route/v1/driving/-65.7531,-19.5836;-65.7600,-19.5900"'
