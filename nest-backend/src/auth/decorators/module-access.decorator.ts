import { SetMetadata } from '@nestjs/common';

export const MODULE_ACCESS_KEY = 'moduleKey';
export const ModuleAccess = (moduleKey: string) => SetMetadata(MODULE_ACCESS_KEY, moduleKey);


