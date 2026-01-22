import asyncio
import json
import os
from aiokafka import AIOKafkaConsumer
from backend.services.ml_service import ml_service
from backend.schemas.request import MachineData

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC = "sensor-data"

async def consume_loop():
    """Background task to consume sensor data and run inference."""
    print(f"Connecting consumer to {KAFKA_BOOTSTRAP_SERVERS}...")
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )

    try:
        await consumer.start()
        print("Kafka Consumer started.")
    except Exception as e:
        print(f"Failed to start Kafka Consumer: {e}")
        return

    try:
        async for msg in consumer:
            try:
                # 1. Deserialize (handled by value_deserializer)
                data_dict = msg.value
                
                # 2. Validate/Convert using Pydantic
                machine_data = MachineData(**data_dict)
                
                # 3. Predict
                result = ml_service.predict(machine_data)
                
                # 4. Process Result (e.g. Log, save to DB, alert)
                # For now, just print to stdout so it appears in logs
                print(f"Partition: {msg.partition} | Offset: {msg.offset} | "
                      f"Prediction: {result['prediction']} "
                      f"(Anomaly: {result['anomaly']}, Prob: {result['failure_probability']:.2f})")
                
            except Exception as e:
                print(f"Error processing message: {e}")
                
    except asyncio.CancelledError:
        print("Consumer task cancelled.")
    finally:
        await consumer.stop()
        print("Kafka Consumer stopped.")
