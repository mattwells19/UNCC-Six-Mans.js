export default function generateRandomId(): string {
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
