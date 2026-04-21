import { usersRepository } from "../repositories/users.repository.js";
import { userToDto } from "../mappers.js";
import { errConflict, errNotFound, errValidation } from "../errors.js";
import { validateCreateUserDto, validateUpdateUserDto } from "../dtos/user.schemas.js";
import type { ListResponse, UserDto } from "../types.js";

export const usersService = {
  list(): ListResponse<UserDto> {
    const items = usersRepository.getAll().map(userToDto);
    return { items, totalItems: items.length };
  },

  getById(id: number): UserDto {
    const user = usersRepository.getById(id);

    if (!user) {
      throw errNotFound('User not found');
    }

    return userToDto(user);
  },

  create(input: unknown): UserDto {
    const validation = validateCreateUserDto(input);

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    if (usersRepository.emailExists(validation.value.email)) {
      throw errConflict('Email already exists', [{ field: 'email', message: 'email already exists' }]);
    }

    return userToDto(usersRepository.create(validation.value));
  },

  update(id: number, input: unknown): UserDto {
    if (!usersRepository.getById(id)) {
      throw errNotFound('User not found');
    }

    const validation = validateUpdateUserDto(input);

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    if (validation.value.email && usersRepository.emailExists(validation.value.email, id)) {
      throw errConflict('Email already exists', [{ field: 'email', message: 'email already exists' }]);
    }

    const updated = usersRepository.update(id, validation.value);

    if (!updated) {
      throw errNotFound('User not found');
    }

    return userToDto(updated);
  },

  delete(id: number): void {
    if (!usersRepository.delete(id)) {
      throw errNotFound('User not found');
    }
  }
};