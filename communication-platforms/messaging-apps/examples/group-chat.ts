/**
 * Group Chat Example
 *
 * Demonstrates group conversation management with roles, permissions,
 * member management, and advanced group features.
 */

import { EventEmitter } from 'events';
import { RealtimeChatClient, Message } from './real-time-chat.js';

// Group member
export interface GroupMember {
  userId: string;
  userName: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  permissions: GroupPermissions;
  isMuted: boolean;
  mutedUntil?: Date;
  customTitle?: string;
  metadata?: Record<string, any>;
}

// Group permissions
export interface GroupPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canChangeGroupInfo: boolean;
  canPinMessages: boolean;
  canDeleteMessages: boolean;
  canMuteMembers: boolean;
}

// Group settings
export interface GroupSettings {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  type: 'public' | 'private' | 'broadcast';
  maxMembers: number;
  isJoinByLinkEnabled: boolean;
  requireApproval: boolean;
  allowMemberInvites: boolean;
  muteAllExceptAdmins: boolean;
  messageHistoryVisibleToNewMembers: boolean;
  createdAt: Date;
  createdBy: string;
}

// Group state
export interface Group {
  settings: GroupSettings;
  members: Map<string, GroupMember>;
  pinnedMessages: string[];
  inviteLink?: string;
}

// Join request
export interface JoinRequest {
  userId: string;
  userName: string;
  groupId: string;
  message?: string;
  requestedAt: Date;
}

/**
 * Group Chat Manager
 *
 * Manages group conversations with member management,
 * roles, permissions, and advanced group features
 */
export class GroupChatManager extends EventEmitter {
  private chatClient: RealtimeChatClient;
  private groups: Map<string, Group> = new Map();
  private currentUserId: string;
  private pendingRequests: Map<string, JoinRequest[]> = new Map();

  constructor(chatClient: RealtimeChatClient, currentUserId: string) {
    super();
    this.chatClient = chatClient;
    this.currentUserId = currentUserId;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.chatClient.on('message', (message: Message) => {
      if (message.type === 'system') {
        this.handleSystemMessage(message);
      }
    });
  }

  /**
   * Create a new group
   */
  createGroup(settings: Omit<GroupSettings, 'id' | 'createdAt' | 'createdBy'>): Group {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const groupSettings: GroupSettings = {
      ...settings,
      id: groupId,
      createdAt: new Date(),
      createdBy: this.currentUserId,
      maxMembers: settings.maxMembers ?? 256,
      type: settings.type ?? 'private',
      isJoinByLinkEnabled: settings.isJoinByLinkEnabled ?? false,
      requireApproval: settings.requireApproval ?? false,
      allowMemberInvites: settings.allowMemberInvites ?? true,
      muteAllExceptAdmins: settings.muteAllExceptAdmins ?? false,
      messageHistoryVisibleToNewMembers: settings.messageHistoryVisibleToNewMembers ?? true,
    };

    const group: Group = {
      settings: groupSettings,
      members: new Map(),
      pinnedMessages: [],
    };

    // Add creator as owner
    const ownerMember: GroupMember = {
      userId: this.currentUserId,
      userName: 'Me', // Should be fetched from user profile
      role: 'owner',
      joinedAt: new Date(),
      permissions: this.getFullPermissions(),
      isMuted: false,
    };

    group.members.set(this.currentUserId, ownerMember);
    this.groups.set(groupId, group);

    // Generate invite link if enabled
    if (groupSettings.isJoinByLinkEnabled) {
      group.inviteLink = this.generateInviteLink(groupId);
    }

    this.emit('group-created', group);

    // Send system message
    this.sendSystemMessage(groupId, `Group "${groupSettings.name}" created`);

    return group;
  }

  /**
   * Add member to group
   */
  addMember(
    groupId: string,
    userId: string,
    userName: string,
    role: GroupMember['role'] = 'member'
  ): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Check permissions
    if (!this.canManageMembers(groupId)) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to add members',
      });
      return false;
    }

    // Check if group is full
    if (group.members.size >= group.settings.maxMembers) {
      this.emit('error', {
        type: 'group-full',
        message: 'Group has reached maximum members',
      });
      return false;
    }

    // Check if already a member
    if (group.members.has(userId)) {
      return false;
    }

    const member: GroupMember = {
      userId,
      userName,
      role,
      joinedAt: new Date(),
      permissions: this.getPermissionsForRole(role),
      isMuted: group.settings.muteAllExceptAdmins && role === 'member',
    };

    group.members.set(userId, member);
    this.emit('member-added', { groupId, member });

    // Send system message
    this.sendSystemMessage(groupId, `${userName} joined the group`);

    return true;
  }

  /**
   * Remove member from group
   */
  removeMember(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(userId);
    if (!member) return false;

    // Cannot remove owner
    if (member.role === 'owner') {
      this.emit('error', {
        type: 'cannot-remove-owner',
        message: 'Cannot remove group owner',
      });
      return false;
    }

    // Check permissions
    if (!this.canManageMembers(groupId)) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to remove members',
      });
      return false;
    }

    group.members.delete(userId);
    this.emit('member-removed', { groupId, member });

    // Send system message
    this.sendSystemMessage(groupId, `${member.userName} left the group`);

    return true;
  }

  /**
   * Update member role
   */
  updateMemberRole(groupId: string, userId: string, newRole: GroupMember['role']): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const currentUser = group.members.get(this.currentUserId);
    if (!currentUser || currentUser.role !== 'owner') {
      this.emit('error', {
        type: 'permission-denied',
        message: 'Only group owner can change member roles',
      });
      return false;
    }

    const member = group.members.get(userId);
    if (!member) return false;

    // Cannot change owner role
    if (member.role === 'owner' || newRole === 'owner') {
      this.emit('error', {
        type: 'cannot-change-owner',
        message: 'Cannot change owner role. Transfer ownership instead.',
      });
      return false;
    }

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getPermissionsForRole(newRole);

    this.emit('member-role-updated', { groupId, member, oldRole });

    // Send system message
    this.sendSystemMessage(groupId, `${member.userName} is now a ${newRole}`);

    return true;
  }

  /**
   * Transfer group ownership
   */
  transferOwnership(groupId: string, newOwnerId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const currentOwner = group.members.get(this.currentUserId);
    if (!currentOwner || currentOwner.role !== 'owner') {
      this.emit('error', {
        type: 'permission-denied',
        message: 'Only current owner can transfer ownership',
      });
      return false;
    }

    const newOwner = group.members.get(newOwnerId);
    if (!newOwner) return false;

    // Update roles
    currentOwner.role = 'admin';
    currentOwner.permissions = this.getPermissionsForRole('admin');

    newOwner.role = 'owner';
    newOwner.permissions = this.getFullPermissions();

    this.emit('ownership-transferred', { groupId, oldOwner: currentOwner, newOwner });

    // Send system message
    this.sendSystemMessage(groupId, `Ownership transferred to ${newOwner.userName}`);

    return true;
  }

  /**
   * Mute member
   */
  muteMember(groupId: string, userId: string, duration?: number): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const currentUser = group.members.get(this.currentUserId);
    if (!currentUser?.permissions.canMuteMembers) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to mute members',
      });
      return false;
    }

    const member = group.members.get(userId);
    if (!member) return false;

    member.isMuted = true;
    if (duration) {
      member.mutedUntil = new Date(Date.now() + duration);

      // Auto-unmute after duration
      setTimeout(() => {
        this.unmuteMember(groupId, userId);
      }, duration);
    }

    this.emit('member-muted', { groupId, member, duration });

    // Send system message
    const durationText = duration ? ` for ${duration / 1000}s` : '';
    this.sendSystemMessage(groupId, `${member.userName} was muted${durationText}`);

    return true;
  }

  /**
   * Unmute member
   */
  unmuteMember(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(userId);
    if (!member) return false;

    member.isMuted = false;
    member.mutedUntil = undefined;

    this.emit('member-unmuted', { groupId, member });

    return true;
  }

  /**
   * Update group settings
   */
  updateGroupSettings(
    groupId: string,
    updates: Partial<Omit<GroupSettings, 'id' | 'createdAt' | 'createdBy'>>
  ): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const currentUser = group.members.get(this.currentUserId);
    if (!currentUser?.permissions.canChangeGroupInfo) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to change group settings',
      });
      return false;
    }

    Object.assign(group.settings, updates);

    // Update invite link if needed
    if (updates.isJoinByLinkEnabled !== undefined) {
      if (updates.isJoinByLinkEnabled) {
        group.inviteLink = this.generateInviteLink(groupId);
      } else {
        group.inviteLink = undefined;
      }
    }

    this.emit('group-settings-updated', { groupId, settings: group.settings });

    return true;
  }

  /**
   * Pin message
   */
  pinMessage(groupId: string, messageId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const currentUser = group.members.get(this.currentUserId);
    if (!currentUser?.permissions.canPinMessages) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to pin messages',
      });
      return false;
    }

    if (group.pinnedMessages.includes(messageId)) {
      return false;
    }

    group.pinnedMessages.push(messageId);
    this.emit('message-pinned', { groupId, messageId });

    return true;
  }

  /**
   * Unpin message
   */
  unpinMessage(groupId: string, messageId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const index = group.pinnedMessages.indexOf(messageId);
    if (index === -1) return false;

    group.pinnedMessages.splice(index, 1);
    this.emit('message-unpinned', { groupId, messageId });

    return true;
  }

  /**
   * Send message to group
   */
  sendGroupMessage(groupId: string, content: string, options: any = {}): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(this.currentUserId);
    if (!member) return false;

    // Check if muted
    if (member.isMuted) {
      if (member.mutedUntil && member.mutedUntil < new Date()) {
        member.isMuted = false;
        member.mutedUntil = undefined;
      } else {
        this.emit('error', {
          type: 'user-muted',
          message: 'You are muted in this group',
        });
        return false;
      }
    }

    // Check permissions
    if (!member.permissions.canSendMessages) {
      this.emit('error', {
        type: 'permission-denied',
        message: 'You do not have permission to send messages',
      });
      return false;
    }

    // Send via chat client
    this.chatClient.sendMessage(groupId, content, options);

    return true;
  }

  /**
   * Handle join request
   */
  requestToJoin(groupId: string, message?: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    if (!group.settings.requireApproval) {
      // Auto-join if approval not required
      this.addMember(groupId, this.currentUserId, 'Me');
      return;
    }

    const request: JoinRequest = {
      userId: this.currentUserId,
      userName: 'Me',
      groupId,
      message,
      requestedAt: new Date(),
    };

    let requests = this.pendingRequests.get(groupId);
    if (!requests) {
      requests = [];
      this.pendingRequests.set(groupId, requests);
    }

    requests.push(request);
    this.emit('join-request', request);

    // Notify admins
    this.sendSystemMessage(groupId, `Join request from ${request.userName}`);
  }

  /**
   * Approve join request
   */
  approveJoinRequest(groupId: string, userId: string): boolean {
    const requests = this.pendingRequests.get(groupId);
    if (!requests) return false;

    const index = requests.findIndex((r) => r.userId === userId);
    if (index === -1) return false;

    const request = requests[index];
    requests.splice(index, 1);

    // Add member
    return this.addMember(groupId, request.userId, request.userName);
  }

  /**
   * Deny join request
   */
  denyJoinRequest(groupId: string, userId: string): boolean {
    const requests = this.pendingRequests.get(groupId);
    if (!requests) return false;

    const index = requests.findIndex((r) => r.userId === userId);
    if (index === -1) return false;

    requests.splice(index, 1);
    this.emit('join-request-denied', { groupId, userId });

    return true;
  }

  /**
   * Leave group
   */
  leaveGroup(groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(this.currentUserId);
    if (!member) return false;

    // Owner must transfer ownership before leaving
    if (member.role === 'owner') {
      this.emit('error', {
        type: 'owner-must-transfer',
        message: 'Owner must transfer ownership before leaving',
      });
      return false;
    }

    return this.removeMember(groupId, this.currentUserId);
  }

  /**
   * Delete group (owner only)
   */
  deleteGroup(groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(this.currentUserId);
    if (!member || member.role !== 'owner') {
      this.emit('error', {
        type: 'permission-denied',
        message: 'Only owner can delete the group',
      });
      return false;
    }

    this.groups.delete(groupId);
    this.emit('group-deleted', { groupId });

    return true;
  }

  /**
   * Get group
   */
  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Get member
   */
  getMember(groupId: string, userId: string): GroupMember | undefined {
    return this.groups.get(groupId)?.members.get(userId);
  }

  /**
   * Get all groups
   */
  getGroups(): Group[] {
    return Array.from(this.groups.values());
  }

  /**
   * Check if user can manage members
   */
  private canManageMembers(groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const member = group.members.get(this.currentUserId);
    return member?.permissions.canAddMembers ?? false;
  }

  /**
   * Get permissions for role
   */
  private getPermissionsForRole(role: GroupMember['role']): GroupPermissions {
    switch (role) {
      case 'owner':
      case 'admin':
        return this.getFullPermissions();
      case 'moderator':
        return {
          canSendMessages: true,
          canSendMedia: true,
          canAddMembers: false,
          canRemoveMembers: false,
          canChangeGroupInfo: false,
          canPinMessages: true,
          canDeleteMessages: true,
          canMuteMembers: true,
        };
      case 'member':
      default:
        return {
          canSendMessages: true,
          canSendMedia: true,
          canAddMembers: false,
          canRemoveMembers: false,
          canChangeGroupInfo: false,
          canPinMessages: false,
          canDeleteMessages: false,
          canMuteMembers: false,
        };
    }
  }

  /**
   * Get full permissions
   */
  private getFullPermissions(): GroupPermissions {
    return {
      canSendMessages: true,
      canSendMedia: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canChangeGroupInfo: true,
      canPinMessages: true,
      canDeleteMessages: true,
      canMuteMembers: true,
    };
  }

  /**
   * Generate invite link
   */
  private generateInviteLink(groupId: string): string {
    const token = Math.random().toString(36).substr(2, 12);
    return `https://chat.example.com/invite/${groupId}/${token}`;
  }

  /**
   * Send system message
   */
  private sendSystemMessage(groupId: string, content: string): void {
    this.chatClient.sendMessage(groupId, content, { type: 'system' });
  }

  /**
   * Handle system message
   */
  private handleSystemMessage(message: Message): void {
    // Process system messages for group events
    this.emit('system-message', message);
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Create and manage group
 */
export async function exampleCreateGroup(chatClient: RealtimeChatClient) {
  const groupManager = new GroupChatManager(chatClient, 'user-123');

  // Create a group
  const group = groupManager.createGroup({
    name: 'Project Team',
    description: 'Team collaboration for Project X',
    type: 'private',
    maxMembers: 50,
    allowMemberInvites: true,
    requireApproval: false,
  });

  console.log('Group created:', group.settings.id);

  // Add members
  groupManager.addMember(group.settings.id, 'user-456', 'Alice', 'admin');
  groupManager.addMember(group.settings.id, 'user-789', 'Bob', 'member');

  // Send message
  groupManager.sendGroupMessage(group.settings.id, 'Welcome to the team!');

  return groupManager;
}

/**
 * Example: Group moderation
 */
export function exampleGroupModeration(groupManager: GroupChatManager, groupId: string) {
  // Mute a member for 1 hour
  groupManager.muteMember(groupId, 'user-spam', 60 * 60 * 1000);

  // Update member role
  groupManager.updateMemberRole(groupId, 'user-456', 'moderator');

  // Pin important message
  groupManager.pinMessage(groupId, 'msg-important-123');

  // Remove troublesome member
  groupManager.removeMember(groupId, 'user-troublemaker');
}

/**
 * Example: Handle join requests
 */
export function exampleJoinRequests(groupManager: GroupChatManager) {
  const groupId = 'group-123';

  groupManager.on('join-request', (request: JoinRequest) => {
    console.log(`Join request from ${request.userName}:`, request.message);

    // Auto-approve if message contains keyword
    if (request.message?.includes('invited by admin')) {
      groupManager.approveJoinRequest(groupId, request.userId);
    } else {
      // Manual review needed
      console.log('Manual review required');
    }
  });
}

/**
 * Example: Broadcast group
 */
export function exampleBroadcastGroup(chatClient: RealtimeChatClient) {
  const groupManager = new GroupChatManager(chatClient, 'admin-123');

  // Create broadcast group (only admins can send)
  const broadcastGroup = groupManager.createGroup({
    name: 'Announcements',
    description: 'Official announcements',
    type: 'broadcast',
    muteAllExceptAdmins: true,
    allowMemberInvites: false,
  });

  // Add subscribers
  groupManager.addMember(broadcastGroup.settings.id, 'user-1', 'User 1');
  groupManager.addMember(broadcastGroup.settings.id, 'user-2', 'User 2');

  // Send broadcast
  groupManager.sendGroupMessage(
    broadcastGroup.settings.id,
    'Important: System maintenance scheduled for tomorrow'
  );
}

/**
 * Example: Transfer ownership
 */
export function exampleTransferOwnership(groupManager: GroupChatManager, groupId: string) {
  groupManager.on('ownership-transferred', ({ groupId, oldOwner, newOwner }) => {
    console.log(`Ownership of ${groupId} transferred from ${oldOwner.userName} to ${newOwner.userName}`);
  });

  // Transfer to trusted admin
  groupManager.transferOwnership(groupId, 'user-trusted-admin');
}
