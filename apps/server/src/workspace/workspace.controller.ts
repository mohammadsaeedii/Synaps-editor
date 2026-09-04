import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { SaveWorkspaceDto, UpdateFileBodyDto } from './dto/workspace.dto';
import { WorkspaceService } from './workspace.service';

@Controller()
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get('workspace')
  async getWorkspace() {
    const snapshot = await this.workspace.getSnapshot();
    return { snapshot };
  }

  @Put('workspace')
  async saveWorkspace(@Body() body: SaveWorkspaceDto) {
    const snapshot = await this.workspace.saveSnapshot(body.snapshot);
    return { snapshot };
  }

  @Patch('files/:id')
  async updateFile(@Param('id') id: string, @Body() body: UpdateFileBodyDto) {
    const file = await this.workspace.updateFile(id, body);
    return { file };
  }
}
