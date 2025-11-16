import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Channel } from '../channel/channel.entity';

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  LINK = 'LINK',
  CODE = 'CODE',
  SYSTEM = 'SYSTEM',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  channelId: string;

  @Column()
  userId: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column('jsonb', { nullable: true })
  attachments: any[];

  @Column('jsonb', { default: [] })
  reactions: {
    emoji: string;
    userId: string;
    createdAt: Date;
  }[];

  @Column({ nullable: true })
  threadId: string;

  @Column({ default: 0 })
  replyCount: number;

  @Column('jsonb', { default: [] })
  mentions: {
    userId: string;
    username: string;
  }[];

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isPinned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  editedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  // 關聯
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Channel)
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'threadId' })
  thread: Message;

  @OneToMany(() => Message, message => message.thread)
  replies: Message[];
}
