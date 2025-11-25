import { PartialType } from '@nestjs/mapped-types';
import { CreateTopicElementDto } from './create-topic-element.dto';

export class UpdateTopicElementDto extends PartialType(CreateTopicElementDto) {}


