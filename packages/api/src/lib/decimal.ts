type DecimalLike = { toString(): string }

export function dec(value: DecimalLike | null | undefined): string | null {
  if (value == null) return null
  return value.toString()
}
