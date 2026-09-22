import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface BilingualFieldProps {
  labelEn: string
  labelFa: string
  id: string
  type?: "text" | "textarea" | "date"
  placeholder?: string
  className?: string
}

export function BilingualField({
  labelEn,
  labelFa,
  id,
  type = "text",
  placeholder = "",
  className = "",
}: BilingualFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs sm:text-sm font-medium text-foreground">
          {labelEn}
        </label>
        <label htmlFor={id} className="text-xs sm:text-sm font-medium text-foreground" dir="rtl">
          {labelFa}
        </label>
      </div>
      {type === "textarea" ? (
        <Textarea
          id={id}
          name={id}
          placeholder={placeholder}
          className="min-h-[80px] bg-card border-border text-foreground"
        />
      ) : (
        <Input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="bg-card border-border text-foreground"
        />
      )}
    </div>
  )
}
