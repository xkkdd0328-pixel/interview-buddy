import { Badge } from "@/components/ui/badge";
import { JOB_STATUS, QUESTION_TYPE, DIFFICULTY, type JobStatus, type QuestionType, type Difficulty } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
  short = false,
}: {
  status: string;
  className?: string;
  short?: boolean;
}) {
  const meta = JOB_STATUS[status as JobStatus];
  if (!meta) {
    return (
      <Badge variant="secondary" className={className}>
        {status}
      </Badge>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        meta.bg,
        meta.text,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {short ? meta.short : meta.label}
    </span>
  );
}

export function QuestionTypeBadge({ type, className }: { type: string; className?: string }) {
  const meta = QUESTION_TYPE[type as QuestionType];
  if (!meta) return <Badge variant="secondary" className={className}>{type}</Badge>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        meta.bg,
        meta.text,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export function DifficultyLabel({ difficulty }: { difficulty: string }) {
  const meta = DIFFICULTY[difficulty as Difficulty];
  if (!meta) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", meta.text)}>
      <span aria-hidden>{"⭐".repeat(meta.stars)}</span>
      {meta.label}
    </span>
  );
}
