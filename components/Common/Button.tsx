import { Button as ShadcnButton } from "@/components/ui/button"

export function Button({ children, ...props }) {
  return <ShadcnButton {...props}>{children}</ShadcnButton>
}
