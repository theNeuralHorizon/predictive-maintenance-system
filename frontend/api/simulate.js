import { SensorSimulator } from '../../utils/mockSimulator';

// Node.js/Vercel Serverless Function to mock the SSE stream
export async function GET(request) {
    const url = new URL(request.url);
    const noiseLevel = parseFloat(url.searchParams.get('noise_level')) || 0.5;

    const encoder = new TextEncoder();
    const simulator = new SensorSimulator(noiseLevel);

    const stream = new ReadableStream({
        async start(controller) {
            // Stream for 60 seconds max to prevent serverless timeout
            for (let i = 0; i < 60; i++) {
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
