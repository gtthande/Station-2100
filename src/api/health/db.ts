import { checkDatabaseHealth } from '../../lib/database';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    return new Response(JSON.stringify(health), {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}



