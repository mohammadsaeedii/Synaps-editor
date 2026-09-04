import { Controller, Get } from '@nestjs/common';
import { PROVIDER_META } from '../ai/providers/catalog';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    const providers = Object.values(PROVIDER_META).map((p) => ({
      id: p.id,
      label: p.label,
      configured: Boolean(process.env[p.envKey]?.trim()),
    }));

    return {
      status: 'ok' as const,
      service: 'synapse-api',
      anthropicConfigured: providers.find((p) => p.id === 'anthropic')?.configured ?? false,
      providers,
      timestamp: new Date().toISOString(),
    };
  }
}
