import { store } from "../store.js";
import type { User } from "../types.js";

export const usersRepository = {
  getAll(): User[] {
    return store.users;
  },

  getById(id: number): User | undefined {
    return store.users.find((user) => user.id === id);
  },

  emailExists(email: string, excludeId?: number): boolean {
    return store.users.some((user) => user.email === email && user.id !== excludeId);
  },

  create(input: { name: string; email: string }): User {
    const user: User = {
      id: store.users.length > 0 ? Math.max(...store.users.map((item) => item.id)) + 1 : 1,
      name: input.name,
      email: input.email
    };

    store.users.push(user);
    return user;
  },

  update(id: number, input: { name?: string; email?: string }): User | undefined {
    const index = store.users.findIndex((user) => user.id === id);

    if (index === -1) {
      return undefined;
    }

    const current = store.users[index]!;
    const updated: User = {
      id: current.id,
      name: input.name ?? current.name,
      email: input.email ?? current.email
    };

    store.users[index] = updated;
    return updated;
  },

  delete(id: number): boolean {
    const index = store.users.findIndex((user) => user.id === id);

    if (index === -1) {
      return false;
    }

    store.users.splice(index, 1);
    return true;
  }
};