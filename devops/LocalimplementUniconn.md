## To locally implement Uniconn

1. Make sure you launch your docker desktop
2. cd uniconn-backend/backend
3. docker build -t uniconn-api:local .
4. use docker images to check if image set up correctly
5. docker swarm init
6. docker network create -d overlay web
7. docker network ls ---- if you found overlay ingress nad overlay web, then network is built, without network traefik will never work
8. cd devops/docker/swarm
9. docker stack deploy -c traefik-stack.yml uniconn, windows user please use the dashboard link not your local host
10. if not working, docker service ls
