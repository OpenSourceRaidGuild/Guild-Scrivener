async function runOctokitWebhook<TCliTask>(task: () => TCliTask) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  try {
    let stdOut = '';
    let stdErr = '';

    const appendStdout = (...args: any[]): void => {
      stdOut += args.map((arg) => arg.toString()).join(' ') + '\n';
    };

    const appendStderr = (...args: any[]): void => {
      stdErr += args.map((arg) => arg.toString()).join(' ') + '\n';
    };

    console.log = appendStdout;
    console.warn = appendStdout;
    console.error = appendStderr;

    await task();

    return {
      stdOut: stdOut.trimEnd(),
      stdErr: stdErr.trimEnd(),
    };
  } finally {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
}
export default runOctokitWebhook;
