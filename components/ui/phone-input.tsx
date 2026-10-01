import { Phone } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

/** A phone number field with a phone icon inside it (a shadcn InputGroup); phones get the number keypad. */
export function PhoneInput({ className, ...props }: Omit<React.ComponentProps<typeof InputGroupInput>, "type">) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <InputGroupText aria-hidden>
          <Phone />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="tel" inputMode="tel" autoComplete="tel" {...props} />
    </InputGroup>
  );
}

/** Just the international dialling code, with the "+" shown inside the field. */
export function CountryCodeInput({ className, ...props }: Omit<React.ComponentProps<typeof InputGroupInput>, "type">) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <InputGroupText aria-hidden className="font-semibold text-ink">
          +
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="text" inputMode="numeric" autoComplete="off" {...props} />
    </InputGroup>
  );
}
