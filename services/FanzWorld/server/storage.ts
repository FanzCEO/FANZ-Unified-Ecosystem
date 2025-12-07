import { type User, type InsertUser, type Post, type InsertPost, type Comment, type InsertComment, type Like, type Follow, type Bookmark, type Notification, type Conversation, type Message, type PostWithAuthor, type CommentWithAuthor, type NotificationWithActor, type ConversationWithParticipant, type MessageWithSender, type SignupUser, type SigninUser, type UserWithoutPassword, users, posts, comments, likes, follows, bookmarks, notifications, conversations, messages } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, asc, notInArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Authentication
  signupUser(userData: SignupUser): Promise<UserWithoutPassword>;
  signinUser(email: string, password: string): Promise<UserWithoutPassword | null>;
  
  // Users
  getUser(id: string): Promise<UserWithoutPassword | undefined>;
  getUserByUsername(username: string): Promise<UserWithoutPassword | undefined>;
  getUserByEmail(email: string): Promise<UserWithoutPassword | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<UserWithoutPassword | undefined>;
  
  // Posts
  createPost(authorId: string, post: InsertPost): Promise<Post>;
  getPost(id: string): Promise<Post | undefined>;
  getPostsWithAuthors(limit?: number): Promise<PostWithAuthor[]>;
  getUserPosts(userId: string): Promise<PostWithAuthor[]>;
  updatePostCounts(postId: string, updates: { likesCount?: number; commentsCount?: number; sharesCount?: number }): Promise<void>;
  
  // Comments
  createComment(postId: string, authorId: string, comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<CommentWithAuthor[]>;
  
  // Likes
  createLike(postId: string, userId: string): Promise<Like>;
  removeLike(postId: string, userId: string): Promise<void>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;
  
  // Follows
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getSuggestedUsers(userId: string, limit?: number): Promise<User[]>;
  
  // Bookmarks
  createBookmark(postId: string, userId: string): Promise<Bookmark>;
  removeBookmark(postId: string, userId: string): Promise<void>;
  isPostBookmarked(postId: string, userId: string): Promise<boolean>;
  getUserBookmarks(userId: string): Promise<PostWithAuthor[]>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<NotificationWithActor[]>;
  
  // Messages
  getUserConversations(userId: string): Promise<ConversationWithParticipant[]>;
  getConversationMessages(conversationId: string, userId: string): Promise<MessageWithSender[]>;
}

export class DatabaseStorage implements IStorage {
  // Authentication methods
  async signupUser(userData: SignupUser): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    // Return user without password for security
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async signinUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password for security
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // User methods (return without password for security)
  async getUser(id: string): Promise<UserWithoutPassword | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByUsername(username: string): Promise<UserWithoutPassword | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<UserWithoutPassword | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return undefined;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<UserWithoutPassword | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) return undefined;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createPost(authorId: string, insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ ...insertPost, authorId })
      .returning();
    return post;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostsWithAuthors(limit: number = 10): Promise<PostWithAuthor[]> {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return result.map(({ posts: post, users: author }) => {
      const { password, ...authorWithoutPassword } = author;
      return {
        ...post,
        author: authorWithoutPassword,
      };
    });
  }

  async getUserPosts(userId: string): Promise<PostWithAuthor[]> {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));

    return result.map(({ posts: post, users: author }) => {
      const { password, ...authorWithoutPassword } = author;
      return {
        ...post,
        author: authorWithoutPassword,
      };
    });
  }

  async updatePostCounts(postId: string, updates: { likesCount?: number; commentsCount?: number; sharesCount?: number }): Promise<void> {
    await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, postId));
  }

  async createComment(postId: string, authorId: string, insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ ...insertComment, postId, authorId })
      .returning();

    // Update post comment count
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post) {
      await this.updatePostCounts(postId, { commentsCount: post.commentsCount + 1 });
    }

    return comment;
  }

  async getPostComments(postId: string): Promise<CommentWithAuthor[]> {
    const result = await db
      .select()
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));

    return result.map(({ comments: comment, users: author }) => {
      const { password, ...authorWithoutPassword } = author;
      return {
        ...comment,
        author: authorWithoutPassword,
      };
    });
  }

  async createLike(postId: string, userId: string): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({ postId, userId })
      .returning();

    // Update post like count
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post) {
      await this.updatePostCounts(postId, { likesCount: post.likesCount + 1 });
    }

    return like;
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    // Update post like count
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post) {
      await this.updatePostCounts(postId, { likesCount: Math.max(0, post.likesCount - 1) });
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return !!like;
  }

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();

    // Update user counts
    const [follower] = await db.select().from(users).where(eq(users.id, followerId));
    const [following] = await db.select().from(users).where(eq(users.id, followingId));

    if (follower) {
      await this.updateUser(followerId, { followingCount: follower.followingCount + 1 });
    }
    if (following) {
      await this.updateUser(followingId, { followersCount: following.followersCount + 1 });
    }

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    // Update user counts
    const [follower] = await db.select().from(users).where(eq(users.id, followerId));
    const [following] = await db.select().from(users).where(eq(users.id, followingId));

    if (follower) {
      await this.updateUser(followerId, { followingCount: Math.max(0, follower.followingCount - 1) });
    }
    if (following) {
      await this.updateUser(followingId, { followersCount: Math.max(0, following.followersCount - 1) });
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async getSuggestedUsers(userId: string, limit: number = 5): Promise<User[]> {
    const followingIds = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIdsList = followingIds.map(f => f.id);
    followingIdsList.push(userId); // Exclude the user themselves

    if (followingIdsList.length > 0) {
      return await db
        .select()
        .from(users)
        .where(notInArray(users.id, followingIdsList))
        .orderBy(desc(users.followersCount))
        .limit(limit);
    }

    return await db
      .select()
      .from(users)
      .where(sql`${users.id} != ${userId}`)
      .orderBy(desc(users.followersCount))
      .limit(limit);
  }

  async createBookmark(postId: string, userId: string): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({ postId, userId })
      .returning();
    return bookmark;
  }

  async removeBookmark(postId: string, userId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
  }

  async isPostBookmarked(postId: string, userId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
    return !!bookmark;
  }

  async getUserBookmarks(userId: string): Promise<PostWithAuthor[]> {
    const result = await db
      .select()
      .from(bookmarks)
      .innerJoin(posts, eq(bookmarks.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return result.map(({ posts: post, users: author }) => {
      const { password, ...authorWithoutPassword } = author;
      return {
        ...post,
        author: authorWithoutPassword,
      };
    });
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<NotificationWithActor[]> {
    // For now, return empty array - we'll populate with actual notifications later
    return [];
  }

  // Messages
  async getUserConversations(userId: string): Promise<ConversationWithParticipant[]> {
    // For now, return empty array - we'll populate with actual conversations later
    return [];
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<MessageWithSender[]> {
    // For now, return empty array - we'll populate with actual messages later
    return [];
  }
}

export const storage = new DatabaseStorage();
