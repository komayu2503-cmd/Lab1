import type { Post, PostDto, User, UserDto } from "./types.js";

export function userToDto(u: User): UserDto {
  return { id: u.id, name: u.name, email: u.email };
}

export function postToDto(p: Post): PostDto {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    text: p.text,
    author: p.author,
    userId: p.userId,
    createdAt: p.createdAt,
    ...(p.updatedAt ? { updatedAt: p.updatedAt } : {})
  };
}
