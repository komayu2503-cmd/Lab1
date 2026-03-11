import { store } from "../store.js";
import type { Post, PostListQuery } from "../types.js";

function getComparableValue(post: Post, field: NonNullable<PostListQuery['sortBy']>): string | number {
  switch (field) {
    case 'createdAt':
      return new Date(post.createdAt).getTime();
    case 'updatedAt':
      return new Date(post.updatedAt ?? 0).getTime();
    case 'title':
      return post.title.toLowerCase();
    case 'category':
      return post.category.toLowerCase();
    case 'author':
      return post.author.toLowerCase();
  }
}

export const postsRepository = {
  getAll(query: PostListQuery): Post[] {
    const normalizedQuery = query.q?.toLowerCase() ?? '';
    let result = store.posts.filter((post) => {
      if (normalizedQuery && !`${post.title} ${post.category} ${post.text} ${post.author}`.toLowerCase().includes(normalizedQuery)) {
        return false;
      }

      if (query.category && post.category !== query.category) {
        return false;
      }

      if (query.author && !post.author.toLowerCase().includes(query.author.toLowerCase())) {
        return false;
      }

      if (query.userId !== undefined && post.userId !== query.userId) {
        return false;
      }

      return true;
    });

    if (query.sortBy) {
      const sortBy = query.sortBy;
      result = [...result].sort((left, right) => {
        const leftValue = getComparableValue(left, sortBy);
        const rightValue = getComparableValue(right, sortBy);

        if (leftValue < rightValue) {
          return query.sortOrder === 'asc' ? -1 : 1;
        }

        if (leftValue > rightValue) {
          return query.sortOrder === 'asc' ? 1 : -1;
        }

        return 0;
      });
    }

    return result;
  },

  getById(id: string): Post | undefined {
    return store.posts.find((post) => post.id === id);
  },

  create(input: { title: string; category: string; text: string; author: string; userId: number | null }): Post {
    const post: Post = {
      id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      title: input.title,
      category: input.category,
      text: input.text,
      author: input.author,
      userId: input.userId,
      createdAt: new Date().toISOString()
    };

    store.posts.unshift(post);
    return post;
  },

  update(id: string, input: { title?: string; category?: string; text?: string; author?: string; userId?: number | null }): Post | undefined {
    const index = store.posts.findIndex((post) => post.id === id);

    if (index === -1) {
      return undefined;
    }

    const current = store.posts[index]!;
    const updated: Post = {
      id: current.id,
      title: input.title ?? current.title,
      category: input.category ?? current.category,
      text: input.text ?? current.text,
      author: input.author ?? current.author,
      userId: input.userId !== undefined ? input.userId : current.userId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString()
    };

    store.posts[index] = updated;
    return updated;
  },

  delete(id: string): boolean {
    const index = store.posts.findIndex((post) => post.id === id);

    if (index === -1) {
      return false;
    }

    store.posts.splice(index, 1);
    return true;
  }
};