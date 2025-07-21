

import { describe, beforeEach, test, expect } from "bun:test";
import { UserRepository } from '../src/repositories/user-repository';
import { CreateUser } from '../src/dtos/user/create';
import { User } from '../src/models/user';

// Mock simple compatible con Bun
type MockFn = ((...args: any[]) => any) & {
  _mockReturnValue?: any;
  _mockResolvedValue?: any;
  called: boolean;
  calls: any[];
  mockReset: () => void;
  mockResolvedValue: (val: any) => void;
  mockReturnValue: (val: any) => void;
  toHaveBeenCalled: () => boolean;
};

function createMockFn(): MockFn {
  const fn = ((...args: any[]) => {
    fn.called = true;
    fn.calls.push(args);
    if (fn._mockResolvedValue !== undefined) return Promise.resolve(fn._mockResolvedValue);
    return fn._mockReturnValue;
  }) as MockFn;
  fn.called = false;
  fn.calls = [];
  fn.mockReset = () => {
    fn.called = false;
    fn.calls = [];
    fn._mockReturnValue = undefined;
    fn._mockResolvedValue = undefined;
  };
  fn.mockResolvedValue = (val: any) => {
    fn._mockResolvedValue = val;
  };
  fn.mockReturnValue = (val: any) => {
    fn._mockReturnValue = val;
  };
  fn.toHaveBeenCalled = () => fn.called;
  return fn;
}

const mockTx = {
  execute: createMockFn(),
  commit: createMockFn(),
  rollback: createMockFn(),
  close: createMockFn(),
};
const mockDbClient = {
  transaction: createMockFn(),
};
mockDbClient.transaction.mockReturnValue(mockTx);

function resetMocks() {
  mockTx.execute.mockReset();
  mockTx.commit.mockReset();
  mockTx.rollback.mockReset();
  mockDbClient.transaction.mockReset();
  mockDbClient.transaction.mockReturnValue(mockTx);
}

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    resetMocks();
    repo = new UserRepository(mockDbClient as any);
  });

  test('create: debería crear un usuario correctamente', async () => {
    const userMock: User = {
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      username: 'juanp',
      email: 'juan@example.com',
      password: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockTx.execute.mockResolvedValue({ rowsAffected: 1, rows: [userMock] });
    const newUser: CreateUser = {
      firstName: 'Juan',
      lastName: 'Pérez',
      username: 'juanp',
      email: 'juan@example.com',
      password: '1234',
    };
    const result = await repo.create(newUser);
    expect(result).toEqual(userMock);
    expect(mockTx.commit.toHaveBeenCalled()).toBe(true);
  });

  test('create: debería retornar error si no se crea el usuario', async () => {
    mockTx.execute.mockResolvedValue({ rowsAffected: 0, rows: [] });
    const newUser: CreateUser = {
      firstName: 'Juan',
      lastName: 'Pérez',
      username: 'juanp',
      email: 'juan@example.com',
      password: '1234',
    };
    const result = await repo.create(newUser);
    expect(result instanceof Error).toBe(true);
    expect(mockTx.rollback.toHaveBeenCalled()).toBe(true);
  });

  test('delete: debería eliminar (desactivar) un usuario correctamente', async () => {
    mockTx.execute.mockResolvedValue({ rowsAffected: 1 });
    const result = await repo.delete(1);
    expect(result).toBeUndefined();
    expect(mockTx.commit.toHaveBeenCalled()).toBe(true);
  });

  test('delete: debería retornar error si no se elimina el usuario', async () => {
    mockTx.execute.mockResolvedValue({ rowsAffected: 0 });
    const result = await repo.delete(1);
    expect(result instanceof Error).toBe(true);
    expect(mockTx.rollback.toHaveBeenCalled()).toBe(true);
  });

  test('getById: debería retornar un usuario si existe', async () => {
    const userMock: User = {
      id: 2,
      firstName: 'Ana',
      lastName: 'García',
      username: 'anag',
      email: 'ana@example.com',
      password: 'abcd',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockTx.execute.mockResolvedValue({ rows: [userMock] });
    const result = await repo.getById(2);
    expect(result).toEqual(userMock);
  });

  test('getById: debería retornar null si no existe el usuario', async () => {
    mockTx.execute.mockResolvedValue({ rows: [] });
    const result = await repo.getById(999);
    expect(result).toBeNull();
  });

  test('getById: debería retornar Error si ocurre una excepción', async () => {
    mockTx.execute.mockReturnValue(Promise.reject(new Error('DB error')));
    const result = await repo.getById(1);
    expect(result instanceof Error).toBe(true);
  });

  test('getByEmailOrUsername: debería retornar un usuario si existe', async () => {
    const userMock: User = {
      id: 3,
      firstName: 'Luis',
      lastName: 'Martínez',
      username: 'luism',
      email: 'luis@example.com',
      password: 'pass',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockTx.execute.mockResolvedValue({ rows: [userMock] });
    const result = await repo.getByEmailOrUsername('luis@example.com');
    expect(result).toEqual(userMock);
  });

  test('getByEmailOrUsername: debería retornar null si no existe el usuario', async () => {
    mockTx.execute.mockResolvedValue({ rows: [] });
    const result = await repo.getByEmailOrUsername('noexiste');
    expect(result).toBeNull();
  });

  test('getByEmailOrUsername: debería retornar Error si ocurre una excepción', async () => {
    mockTx.execute.mockReturnValue(Promise.reject(new Error('DB error')));
    const result = await repo.getByEmailOrUsername('error');
    expect(result instanceof Error).toBe(true);
  });
});
