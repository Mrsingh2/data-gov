import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() body: { name?: string }) {
    return this.usersService.updateProfile(user.id, body);
  }
}
