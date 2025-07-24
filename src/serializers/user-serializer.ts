import { UserResponseDto } from '../dtos/user';
import { User } from '../models/user';

export const userSerializer = (user: User) => {
	return UserResponseDto.parse(user);
}
