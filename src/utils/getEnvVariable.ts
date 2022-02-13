export default function getEnvVariable(token: string): string {
  const envVariable = process.env[token] ?? process.env[token.toUpperCase()];

  if (!envVariable) {
    throw new Error(`No environment variable named ${token}.`);
  }

  return envVariable;
}
