#!/bin/bash
echo "Stopping any existing containers..."
podman rm -f pm-backend zookeeper kafka 2>/dev/null || true

echo "Starting infrastructure (Kafka + Zookeeper)..."
# We need to run these inside a pod or network them manually if no compose
# For simplicity in this script, we'll try to use podman-compose if available, 
# else we'll assume the user has run the compose command I just sent properly.
# But "podman compose" failed earlier for user.

# PLAN B: Manual Networking setup if compose fails
# 1. Create network
podman network create pm-net 2>/dev/null || true

# 2. Start Zookeeper
podman run -d --name zookeeper --network pm-net -p 2181:2181 docker.io/zookeeper:3.9

# 3. Start Kafka (Confluent)
# Listeners:
# - PLAINTEXT:9092 (Internal for Backend)
# - PLAINTEXT_HOST:9093 (External for Producer)
podman run -d --name kafka --network pm-net -p 9093:9093 \
    -e KAFKA_NODE_ID=1 \
    -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
    -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT \
    -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093 \
    -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,PLAINTEXT_HOST://0.0.0.0:9093 \
    -e KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT \
    -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
    docker.io/confluentinc/cp-kafka:7.6.0

# 4. Build & Start Backend
podman build -t predictive-maintenance-backend -f infra/Dockerfile.backend .
podman run -d --name pm-backend --network pm-net -p 8000:8000 \
    -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
    predictive-maintenance-backend

echo "Waiting for services..."
sleep 15

echo "Starting Producer..."
# Producer connects to localhost:9093 (EXTERNAL listener)
export KAFKA_BOOTSTRAP_SERVERS=localhost:9093
./venv/bin/python streaming/producer.py &
PRODUCER_PID=$!

echo "Showing backend logs (Ctrl+C to stop)..."
podman logs -f pm-backend

# Cleanup on exit
kill $PRODUCER_PID
