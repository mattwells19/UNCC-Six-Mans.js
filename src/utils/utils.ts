export function generateRandomId(): string {
  let chars = "";

  for (let i = 0; i < 6; i++) {
    // 48 - 57 = 0 - 9
    const randomNumber = Math.random() * (57 - 48) + 48;
    // 65 - 90 = A - Z
    const randomLetter = Math.random() * (90 - 65) + 65;
    const randomChar = Math.random() < 0.5 ? randomNumber : randomLetter;

    chars += String.fromCharCode(randomChar);

    // add a dash halfway through
    if (i == 2) chars += "-";
  }

  return chars;
}

export function getEnvVariable(token: string): string {
  const envVariable = process.env[token];

  if (!envVariable) {
    throw new Error(`No environment variable named ${token}.`);
  }

  return envVariable;
}

export async function waitForAllPromises<Item, AsyncResponse>(
  items: Array<Item> | ReadonlyArray<Item>,
  asyncFunc: (item: Item) => Promise<AsyncResponse>
): Promise<Array<AsyncResponse>> {
  const promises = [];
  for (const item of items) {
    promises.push(asyncFunc(item));
  }
  return await Promise.all(promises);
}
