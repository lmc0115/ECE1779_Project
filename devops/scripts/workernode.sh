docker service create \
  --name registry \
  --publish published=5000,target=5000 \
  --constraint node.role==manager \
  --mount type=volume,source=registry-data,target=/var/lib/registry \
  registry:2

docker tag uniconn-api:latest 143.198.39.167:5000/uniconn-api:latest

docker push 143.198.39.167:5000/uniconn-api:latest