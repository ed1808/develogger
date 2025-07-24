import { password as p } from 'bun';

export const makePassword = async (password: string): Promise<string> => {
	return await p.hash(password);
};

export const validatePassword = async (
	password: string,
	storedPassword: string
): Promise<boolean> => {
	return await p.verify(password, storedPassword);
};
