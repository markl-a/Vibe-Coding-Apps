/**
 * Team Chat Messaging Examples
 *
 * This example demonstrates:
 * - Sending messages to channels
 * - Creating and managing channels
 * - Handling user mentions and notifications
 * - Thread conversations
 * - Message reactions and file attachments
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for messaging operations
interface ChannelCreationData {
  name: string;
  description?: string;
  type: ChannelType;
  isPrivate: boolean;
  creatorId: string;
  workspaceId: string;
}

interface MessageData {
  channelId: string;
  senderId: string;
  content: string;
  parentMessageId?: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE' | 'ANNOUNCEMENT';
type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';

/**
 * Create a new channel
 *
 * @param data - Channel creation details
 * @returns Created channel object
 */
export async function createChannel(data: ChannelCreationData) {
  try {
    // Validate channel name (alphanumeric, hyphens, underscores)
    const channelNameRegex = /^[a-z0-9-_]+$/;
    const normalizedName = data.name.toLowerCase().replace(/\s+/g, '-');

    if (!channelNameRegex.test(normalizedName)) {
      throw new Error(
        'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
      );
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name: normalizedName,
        displayName: data.name,
        description: data.description,
        type: data.type,
        isPrivate: data.isPrivate,
        creatorId: data.creatorId,
        workspaceId: data.workspaceId,
        createdAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Automatically add creator as channel member
    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: data.creatorId,
        role: 'OWNER',
        joinedAt: new Date()
      }
    });

    // Post system message
    await prisma.message.create({
      data: {
        channelId: channel.id,
        senderId: data.creatorId,
        content: `Channel created by ${channel.creator.firstName} ${channel.creator.lastName}`,
        messageType: 'SYSTEM',
        createdAt: new Date()
      }
    });

    console.log('Channel created successfully:', {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      creator: `${channel.creator.firstName} ${channel.creator.lastName}`,
      isPrivate: channel.isPrivate
    });

    return channel;
  } catch (error) {
    console.error('Error creating channel:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Channel with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Workspace or creator not found');
      }
    }

    throw error;
  }
}

/**
 * Add members to a channel
 *
 * @param channelId - Channel ID
 * @param userIds - Array of user IDs to add
 * @param invitedBy - ID of user sending invitations
 * @returns Added channel members
 */
export async function addChannelMembers(
  channelId: string,
  userIds: string[],
  invitedBy: string
) {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Check if inviter is a member
    const inviterMembership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: invitedBy
      }
    });

    if (!inviterMembership) {
      throw new Error('You must be a channel member to invite others');
    }

    // Add members
    const memberPromises = userIds.map(async userId => {
      // Check if already a member
      const existing = await prisma.channelMember.findFirst({
        where: { channelId, userId }
      });

      if (existing) {
        console.log(`User ${userId} is already a member`);
        return null;
      }

      // Add member
      const member = await prisma.channelMember.create({
        data: {
          channelId,
          userId,
          role: 'MEMBER',
          joinedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Post system message
      await prisma.message.create({
        data: {
          channelId,
          senderId: invitedBy,
          content: `${member.user.firstName} ${member.user.lastName} joined the channel`,
          messageType: 'SYSTEM',
          createdAt: new Date()
        }
      });

      return member;
    });

    const members = (await Promise.all(memberPromises)).filter(m => m !== null);

    console.log('Members added to channel:', {
      channelId,
      channelName: channel.name,
      membersAdded: members.length
    });

    return members;
  } catch (error) {
    console.error('Error adding channel members:', error);
    throw error;
  }
}

/**
 * Send a message to a channel
 *
 * @param data - Message details
 * @returns Created message object
 */
export async function sendMessage(data: MessageData) {
  try {
    // Validate message content
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (data.content.length > 4000) {
      throw new Error('Message exceeds maximum length of 4000 characters');
    }

    // Verify sender is a channel member
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId: data.channelId,
        userId: data.senderId
      }
    });

    if (!membership) {
      throw new Error('You must be a channel member to send messages');
    }

    // Parse mentions from content (@username)
    const mentionRegex = /@(\w+)/g;
    const mentionedUsernames = Array.from(
      data.content.matchAll(mentionRegex),
      m => m[1]
    );

    // Create message
    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        senderId: data.senderId,
        content: data.content,
        messageType: 'TEXT',
        parentMessageId: data.parentMessageId,
        createdAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    // Handle mentions
    if (data.mentions && data.mentions.length > 0) {
      await handleMentions(message.id, data.mentions, data.senderId);
    }

    // Handle attachments
    if (data.attachments && data.attachments.length > 0) {
      await addMessageAttachments(message.id, data.attachments);
    }

    // Update channel last activity
    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        lastActivityAt: new Date(),
        messageCount: { increment: 1 }
      }
    });

    console.log('Message sent:', {
      id: message.id,
      channel: message.channel.name,
      sender: `${message.sender.firstName} ${message.sender.lastName}`,
      isReply: !!data.parentMessageId,
      mentionsCount: data.mentions?.length || 0
    });

    return message;
  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Channel or sender not found');
      }
    }

    throw error;
  }
}

/**
 * Handle user mentions in messages
 *
 * @param messageId - Message ID
 * @param userIds - Array of mentioned user IDs
 * @param senderId - ID of user who sent the message
 */
async function handleMentions(
  messageId: string,
  userIds: string[],
  senderId: string
) {
  try {
    const mentionPromises = userIds.map(async userId => {
      // Don't create notification for self-mentions
      if (userId === senderId) return null;

      // Create mention record
      const mention = await prisma.mention.create({
        data: {
          messageId,
          userId,
          createdAt: new Date()
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'MENTION',
          referenceId: messageId,
          referenceType: 'MESSAGE',
          content: 'You were mentioned in a message',
          isRead: false,
          createdAt: new Date()
        }
      });

      return mention;
    });

    await Promise.all(mentionPromises);

    console.log('Mentions processed:', {
      messageId,
      mentionsCount: userIds.length
    });
  } catch (error) {
    console.error('Error handling mentions:', error);
    throw error;
  }
}

/**
 * Add attachments to a message
 *
 * @param messageId - Message ID
 * @param attachments - Array of attachment data
 */
async function addMessageAttachments(
  messageId: string,
  attachments: MessageAttachment[]
) {
  try {
    const attachmentPromises = attachments.map(attachment =>
      prisma.attachment.create({
        data: {
          messageId,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl,
          uploadedAt: new Date()
        }
      })
    );

    const created = await Promise.all(attachmentPromises);

    console.log('Attachments added:', {
      messageId,
      count: created.length
    });

    return created;
  } catch (error) {
    console.error('Error adding attachments:', error);
    throw error;
  }
}

/**
 * Add a reaction to a message
 *
 * @param messageId - Message ID
 * @param userId - User ID
 * @param emoji - Emoji reaction
 * @returns Created reaction
 */
export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  try {
    // Check if user already reacted with this emoji
    const existing = await prisma.reaction.findFirst({
      where: {
        messageId,
        userId,
        emoji
      }
    });

    if (existing) {
      // Remove reaction if it already exists (toggle behavior)
      await prisma.reaction.delete({
        where: { id: existing.id }
      });

      console.log('Reaction removed:', { messageId, userId, emoji });
      return null;
    }

    // Add new reaction
    const reaction = await prisma.reaction.create({
      data: {
        messageId,
        userId,
        emoji,
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('Reaction added:', {
      messageId,
      user: `${reaction.user.firstName} ${reaction.user.lastName}`,
      emoji
    });

    return reaction;
  } catch (error) {
    console.error('Error adding reaction:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Message or user not found');
      }
    }

    throw error;
  }
}

/**
 * Get messages from a channel with pagination
 *
 * @param channelId - Channel ID
 * @param limit - Number of messages to retrieve
 * @param before - Get messages before this message ID (for pagination)
 * @returns Paginated messages
 */
export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  before?: string
) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && {
          id: {
            lt: before
          }
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        replies: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            createdAt: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    console.log('Messages retrieved:', {
      channelId,
      count: messages.length,
      hasMore: messages.length === limit
    });

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit,
      oldestMessageId: messages.length > 0 ? messages[0].id : null
    };
  } catch (error) {
    console.error('Error retrieving messages:', error);
    throw error;
  }
}

/**
 * Search messages in a workspace
 *
 * @param workspaceId - Workspace ID
 * @param query - Search query
 * @param userId - User ID (to filter by accessible channels)
 * @returns Search results
 */
export async function searchMessages(
  workspaceId: string,
  query: string,
  userId: string
) {
  try {
    // Get channels user has access to
    const userChannels = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true }
    });

    const channelIds = userChannels.map(c => c.channelId);

    // Search messages
    const messages = await prisma.message.findMany({
      where: {
        channel: {
          workspaceId
        },
        channelId: {
          in: channelIds
        },
        content: {
          contains: query,
          mode: 'insensitive'
        },
        messageType: 'TEXT'
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log('Messages searched:', {
      query,
      resultsCount: messages.length
    });

    return messages;
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
}

/**
 * Mark channel as read for a user
 *
 * @param channelId - Channel ID
 * @param userId - User ID
 */
export async function markChannelAsRead(channelId: string, userId: string) {
  try {
    const membership = await prisma.channelMember.findFirst({
      where: { channelId, userId }
    });

    if (!membership) {
      throw new Error('User is not a member of this channel');
    }

    // Update last read timestamp
    await prisma.channelMember.update({
      where: { id: membership.id },
      data: {
        lastReadAt: new Date()
      }
    });

    // Mark channel notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        referenceType: 'MESSAGE',
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    console.log('Channel marked as read:', { channelId, userId });
  } catch (error) {
    console.error('Error marking channel as read:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating messaging workflow
 */
export async function runMessagingExample() {
  try {
    console.log('=== Team Chat Messaging Example ===\n');

    // 1. Create a new channel
    console.log('1. Creating new channel...');
    const channel = await createChannel({
      name: 'project-alpha',
      description: 'Discussion for Project Alpha development',
      type: 'PUBLIC',
      isPrivate: false,
      creatorId: 'user-123', // Replace with actual user ID
      workspaceId: 'workspace-456' // Replace with actual workspace ID
    });

    // 2. Add members to channel
    console.log('\n2. Adding members to channel...');
    await addChannelMembers(
      channel.id,
      ['user-789', 'user-101', 'user-102'], // Replace with actual user IDs
      'user-123'
    );

    // 3. Send a message
    console.log('\n3. Sending message...');
    const message = await sendMessage({
      channelId: channel.id,
      senderId: 'user-123',
      content: 'Hello team! Welcome to the Project Alpha channel. @john let\'s discuss the timeline.',
      mentions: ['user-789'] // John's user ID
    });

    // 4. Send a reply
    console.log('\n4. Sending reply...');
    await sendMessage({
      channelId: channel.id,
      senderId: 'user-789',
      content: 'Thanks! I can start next week.',
      parentMessageId: message.id
    });

    // 5. Send message with attachment
    console.log('\n5. Sending message with attachment...');
    await sendMessage({
      channelId: channel.id,
      senderId: 'user-101',
      content: 'Here are the design mockups',
      attachments: [
        {
          fileName: 'mockup-v1.png',
          fileType: 'image/png',
          fileSize: 1024567,
          fileUrl: 'https://storage.example.com/files/mockup-v1.png'
        }
      ]
    });

    // 6. Add reactions
    console.log('\n6. Adding reactions...');
    await addReaction(message.id, 'user-789', '👍');
    await addReaction(message.id, 'user-101', '🎉');

    // 7. Get messages
    console.log('\n7. Getting channel messages...');
    const { messages } = await getChannelMessages(channel.id, 20);
    console.log(`Retrieved ${messages.length} messages`);

    // 8. Search messages
    console.log('\n8. Searching messages...');
    await searchMessages('workspace-456', 'timeline', 'user-123');

    // 9. Mark channel as read
    console.log('\n9. Marking channel as read...');
    await markChannelAsRead(channel.id, 'user-789');

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runMessagingExample();
