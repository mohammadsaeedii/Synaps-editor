import { Body, Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('models')
  listModels() {
    return this.aiService.listModels();
  }

  @Post('chat')
  streamChat(
    @Body() body: ChatRequestDto,
    @Headers('x-api-key') apiKey: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.aiService.streamChat(body, apiKey, req, res);
  }
}
