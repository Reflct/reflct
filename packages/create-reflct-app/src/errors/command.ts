class CommandError extends Error {
  command?: string;

  constructor(message: string, command?: string) {
    super(message);
    this.command = command;
  }
}

export default CommandError;
