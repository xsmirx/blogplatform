import { ServiceIdentifier } from 'inversify';

export interface LogRepository {
  countLogs(input: {
    url: string;
    ip: string;
    sinceDate: Date;
  }): Promise<number>;
  createLog(input: { url: string; ip: string }): Promise<string>;
}

export const LOG_ROPOSITORY: ServiceIdentifier<LogRepository> =
  Symbol('LogRepository');
