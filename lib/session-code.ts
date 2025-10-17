export function generiereSessionCode(): string {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return code;
}

