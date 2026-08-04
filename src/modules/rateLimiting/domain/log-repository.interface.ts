export interface LogRepository {
  countLogs(input: {
    url: string;
    ip: string;
    sinceDate: Date;
  }): Promise<number>;
  createLog(input: { url: string; ip: string }): Promise<string>;
}
