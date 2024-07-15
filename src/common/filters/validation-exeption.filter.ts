import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExeptionFilter implements ExceptionFilter {
  private titleMessage: string;
  private statusCode: HttpStatus;

  constructor(title: string, httpStatus = HttpStatus.UNPROCESSABLE_ENTITY) {
    this.titleMessage = title;
    this.statusCode = httpStatus;
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as { message: string[] };

    const validationErrors = this.transformFailList(exceptionResponse.message);

    response.status(this.statusCode).json({
      message: this.titleMessage,
      fails: validationErrors,
    });
  }

  private transformFailList(messages: string[] | string) {
    if (Array.isArray(messages)) {
      return messages.reduce((fails, message) => {
        const [field, purpose] = message.split(':');

        fails[field] = [purpose];
        return fails;
      }, {});
    }

    return messages;
  }
}
