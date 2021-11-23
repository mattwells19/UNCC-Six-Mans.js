export default function getEnvVariable(token: string): string {
  const envVariable = process.env[token];

  if (!envVariable) {
    throw new Error(`No environment variable named ${token}.`);
  }

  return envVariable;
}
