docker exec -i $(docker ps --filter "name=uniconn_db" -q) \ 
psql -U uniconn_user -d uniconn < uniconn-backend/db/schema.sql

#When writing md, specify run deploy.sh first, then loaddatabase.sh to initialize the database schema