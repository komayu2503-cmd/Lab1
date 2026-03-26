import type { AppData } from "./types.js";

export const store: AppData = {
  users: [
    { id: 1, name: 'Alice',   email: 'alice@example.com' },
    { id: 2, name: 'Bob',     email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ],
  categories: ['News', 'Tutorial', 'Opinion', 'Announcement'],
  posts: [
    {
      id: '1774368984064775',
      title: 'ыыыы',
      category: 'News',
      text: 'ы',
      author: 'charlie@example.com',
      userId: 3,
      createdAt: '2026-03-24T16:16:24.064Z'
    },
    {
      id: '1773338136008221',
      title: 'sssss',
      category: 'News',
      text: 'g s s  gsd gd sde ae  f f f  f f f f f  f f f f  f f f f f f f  f f  f',
      author: 'alice@example.com',
      userId: 1,
      createdAt: '2026-03-12T17:55:36.008Z',
      updatedAt: '2026-03-12T17:58:22.707Z'
    },
    {
      id: '1773338017139403',
      title: 'gfgfggfgfgfg',
      category: 'Tutorial',
      text: 'ssssssssфяй',
      author: 'bird@gmail.com',
      userId: null,
      createdAt: '2026-03-12T17:53:37.139Z',
      updatedAt: '2026-03-24T16:17:42.684Z'
    }
  ]
};
