import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
    default: ChannelType.PUBLIC,
  })
  type: ChannelType;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isReadOnly: boolean;

  @Column()
  createdBy: string;

  @Column('jsonb', {
    default: {
      notifications: 'ALL',
      allowThreads: true,
      allowReactions: true,
      retentionDays: null,
    },
  })
  settings: {
    notifications: 'ALL' | 'MENTIONS' | 'NONE';
    allowThreads: boolean;
    allowReactions: boolean;
    retentionDays?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'channel_members',
    joinColumn: { name: 'channelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: User[];
}
