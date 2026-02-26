export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const url = new URL(request.url);
    const noiseLevel = parseFloat(url.searchParams.get('noise_level')) || 0.5;

    class SensorSimulator {
        constructor(noiseStdDev = 0.5) {
            this.baseline = {
                air_temperature: 298.1,
                process_temperature: 308.6,
                rotational_speed: 1551.0,
                torque: 42.8,
                tool_wear: 0.0,
                engine_rpm: 2500.0,
                oil_pressure_psi: 40.0,
                coolant_temp_c: 90.0,
                vibration_level: 0.5,
                engine_temp_c: 100.0
            };
            this.noiseStdDev = noiseStdDev;
            this.tick = 0;
        }

        generateNoisyPayload() {
            this.tick += 1;
            const degradationFactor = this.tick * 0.5 * (1 + this.tick * 0.05);
            const payload = {};

            for (const [key, value] of Object.entries(this.baseline)) {
                let baseVal = value;
                if (key === "coolant_temp_c") baseVal += degradationFactor * 1.5;
                else if (key === "engine_temp_c") baseVal += degradationFactor * 1.2;
                else if (key === "vibration_level") baseVal += degradationFactor * 0.08;
                else if (key === "oil_pressure_psi") baseVal -= degradationFactor * 0.8;

                const scaleFactor = Math.max(1.0, Math.abs(baseVal) * 0.05);
                let u = 0, v = 0;
                while (u === 0) u = Math.random();
                while (v === 0) v = Math.random();
                const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

                let noisyVal = baseVal + (num * scaleFactor * this.noiseStdDev);
                if (noisyVal < 0 && !['torque', 'vibration_level'].includes(key)) noisyVal = 0.0;
                payload[key] = Number(noisyVal.toFixed(2));
            }
            payload.timestamp = Date.now() / 1000;
            return payload;
        }
    }

    const encoder = new TextEncoder();
    const simulator = new SensorSimulator(noiseLevel);

    const stream = new ReadableStream({
        async start(controller) {
            // Stream for 25 seconds then close to avoid Edge timeout limits on Hobby tier
            for (let i = 0; i < 25; i++) {
                const payload = simulator.generateNoisyPayload();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                await new Promise(r => setTimeout(r, 1000));
            }
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
