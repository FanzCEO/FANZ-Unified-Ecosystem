import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, signupSchema, signinSchema } from "@shared/schema";
import { requireAuth, getCurrentUserId } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.signupUser(validatedData);
      req.session.userId = user.id;
      
      res.status(201).json({ user, message: "User created successfully" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const validatedData = signinSchema.parse(req.body);
      
      const user = await storage.signinUser(validatedData.email, validatedData.password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      res.json({ user, message: "Signed in successfully" });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(400).json({ error: "Failed to sign in" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to sign out" });
      }
      res.json({ message: "Signed out successfully" });
    });
  });

  // Get current user (requires authentication)
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get feed posts
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await storage.getPostsWithAuthors(limit);
      
      // Add isLiked and isBookmarked status for current user
      const currentUserId = getCurrentUserId(req);
      const postsWithStatus = await Promise.all(
        posts.map(async (post) => ({
          ...post,
          isLiked: currentUserId ? await storage.isPostLiked(post.id, currentUserId) : false,
          isBookmarked: currentUserId ? await storage.isPostBookmarked(post.id, currentUserId) : false,
        }))
      );
      
      res.json(postsWithStatus);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Create a new post
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const validatedPost = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost(currentUserId, validatedPost);
      const author = await storage.getUser(currentUserId);
      
      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }
      
      res.status(201).json({ ...post, author });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Failed to create post" });
    }
  });

  // Like/unlike a post
  app.post("/api/posts/:postId/like", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const isLiked = await storage.isPostLiked(postId, currentUserId);
      
      if (isLiked) {
        await storage.removeLike(postId, currentUserId);
      } else {
        await storage.createLike(postId, currentUserId);
      }
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json({
        isLiked: !isLiked,
        likesCount: post.likesCount,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Get post comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Create a comment
  app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const validatedComment = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment(postId, currentUserId, validatedComment);
      const author = await storage.getUser(currentUserId);
      
      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }
      
      res.status(201).json({ ...comment, author });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: "Failed to create comment" });
    }
  });

  // Get suggested users
  app.get("/api/users/suggested", async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.json([]); // Return empty array if not authenticated
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const users = await storage.getSuggestedUsers(currentUserId, limit);
      res.json(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ error: "Failed to fetch suggested users" });
    }
  });

  // Follow/unfollow a user
  app.post("/api/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const isFollowing = await storage.isFollowing(currentUserId, userId);
      
      if (isFollowing) {
        await storage.unfollowUser(currentUserId, userId);
      } else {
        await storage.followUser(currentUserId, userId);
      }
      
      res.json({ isFollowing: !isFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ error: "Failed to toggle follow" });
    }
  });

  // Bookmark/unbookmark a post
  app.post("/api/posts/:postId/bookmark", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const isBookmarked = await storage.isPostBookmarked(postId, currentUserId);
      
      if (isBookmarked) {
        await storage.removeBookmark(postId, currentUserId);
      } else {
        await storage.createBookmark(postId, currentUserId);
      }
      
      res.json({ isBookmarked: !isBookmarked });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  // Get user's bookmarked posts
  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const bookmarks = await storage.getUserBookmarks(currentUserId);
      
      // Add isLiked and isBookmarked status for current user
      const bookmarksWithStatus = await Promise.all(
        bookmarks.map(async (post) => ({
          ...post,
          isLiked: await storage.isPostLiked(post.id, currentUserId),
          isBookmarked: true, // All posts in bookmarks are bookmarked
        }))
      );
      
      res.json(bookmarksWithStatus);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  // Get user's replies/comments
  app.get("/api/user/replies", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const allPosts = await storage.getPostsWithAuthors();
      const userReplies = [];
      
      for (const post of allPosts) {
        const comments = await storage.getPostComments(post.id);
        const userComments = comments.filter(comment => comment.authorId === currentUserId);
        userReplies.push(...userComments);
      }
      
      res.json(userReplies);
    } catch (error) {
      console.error("Error fetching user replies:", error);
      res.status(500).json({ error: "Failed to fetch user replies" });
    }
  });

  // Get user's liked posts
  app.get("/api/user/likes", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const allPosts = await storage.getPostsWithAuthors();
      
      const likedPosts = [];
      for (const post of allPosts) {
        const isLiked = await storage.isPostLiked(post.id, currentUserId);
        if (isLiked) {
          likedPosts.push({
            ...post,
            isLiked: true,
            isBookmarked: await storage.isPostBookmarked(post.id, currentUserId),
          });
        }
      }
      
      res.json(likedPosts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ error: "Failed to fetch liked posts" });
    }
  });

  // Get user by username for profile pages
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get user's posts by username
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      
      // Add isLiked and isBookmarked status for current user
      const currentUserId = getCurrentUserId(req);
      const postsWithStatus = await Promise.all(
        posts.map(async (post) => ({
          ...post,
          isLiked: currentUserId ? await storage.isPostLiked(post.id, currentUserId) : false,
          isBookmarked: currentUserId ? await storage.isPostBookmarked(post.id, currentUserId) : false,
        }))
      );
      
      res.json(postsWithStatus);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  // Get notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const notifications = await storage.getUserNotifications(currentUserId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get conversations
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const conversations = await storage.getUserConversations(currentUserId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:conversationId/messages", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const messages = await storage.getConversationMessages(conversationId, currentUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
