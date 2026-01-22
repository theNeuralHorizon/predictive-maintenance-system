import json
import time
import random
import os
from kafka import KafkaProducer

# Configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "sensor-data"

def get_producer():
    """Retries connection until Kafka is ready."""
    while True:
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            print("Connected to Kafka!")
            return producer
        except Exception as e:
            print(f"Waiting for Kafka... ({e})")
            time.sleep(5)

def generate_sensor_data():
    """Generates synthetic sensor readings."""
    return {
        "Air temperature [K]": round(random.uniform(295, 305), 1),
        "Process temperature [K]": round(random.uniform(305, 315), 1),
        "Rotational speed [rpm]": random.randint(1100, 2000),
        "Torque [Nm]": round(random.uniform(10, 70), 1),
        "Tool wear [min]": random.randint(0, 250)
    }

def main():
    producer = get_producer()
    
    print(f"Producing to topic '{TOPIC}'...")
    try:
        while True:
            data = generate_sensor_data()
            producer.send(TOPIC, data)
            print(f"Sent: {data}")
            time.sleep(2) # Simulate 2-second interval
    except KeyboardInterrupt:
        print("Stopping producer.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
