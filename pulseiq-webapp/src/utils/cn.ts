export type ClassValue = string | number | boolean | null | undefined | ClassValue[] | { [key: string]: boolean | null | undefined };

function flattenClassValue(value: ClassValue, out: string[]): void {
  if (!value) return;

  if (typeof value === "string" || typeof value === "number") {
    out.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => flattenClassValue(item, out));
    return;
  }

  if (typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (value[key]) out.push(key);
    }
  }
}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  inputs.forEach((input) => flattenClassValue(input, classes));
  return classes.join(" ");
}
