// src/utils/fakeUser.ts
import { faker } from '@faker-js/faker';

export const generateFakeUser = (id?: string) => {
  return {
    name: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(), // Or use another avatar service
    id: id || faker.string.uuid(),
  };
};
