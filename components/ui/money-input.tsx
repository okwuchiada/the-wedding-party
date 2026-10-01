import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

/**
 * An amount with its currency symbol inside the field (a shadcn InputGroup).
 * The symbol is decoration; say the currency in the field's label for screen readers.
 */
export function MoneyInput({ symbol, className, ...props }: { symbol: string } & Omit<React.ComponentProps<typeof InputGroupInput>, "type">) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <InputGroupText aria-hidden className="font-semibold text-ink">
          {symbol}
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="number" inputMode="decimal" className="tabular-nums" {...props} />
    </InputGroup>
  );
}
