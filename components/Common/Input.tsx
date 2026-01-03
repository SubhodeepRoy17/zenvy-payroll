import { Input as ShadcnInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Input({ label, ...props }) {
  return (
    <div className="grid w-full items-center gap-1.5">
      {label && <Label>{label}</Label>}
      <ShadcnInput {...props} />
    </div>
  )
}
