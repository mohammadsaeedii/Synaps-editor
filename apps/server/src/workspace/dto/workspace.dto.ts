import { IsObject, IsOptional } from 'class-validator';

/**
 * Accepts a full client workspace snapshot.
 * Validated lightly (object) — deep shape enforced in the service mapper.
 */
export class SaveWorkspaceDto {
  @IsObject()
  snapshot!: Record<string, unknown>;
}

export class UpdateFileBodyDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  parentId?: string | null;

  @IsOptional()
  content?: string;

  @IsOptional()
  language?: string;

  @IsOptional()
  encoding?: string;

  @IsOptional()
  mimeType?: string | null;

  @IsOptional()
  size?: number | null;

  @IsOptional()
  expanded?: boolean;

  @IsOptional()
  pinned?: boolean;

  @IsOptional()
  favorite?: boolean;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  dir?: boolean;
}
