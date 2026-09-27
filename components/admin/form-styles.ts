// Shared classes for the dashboard's forms, layered on the shadcn/ui field components.

/** A small caption label stacked over its field (`<Label className={FIELD_LABEL}>Name<Input …/></Label>`). */
export const FIELD_LABEL = "flex-col items-stretch gap-1.5 text-xs font-normal text-ink/60";

/** The dashboard's compact fields: a touch shorter than the auth pages'. */
export const FIELD = "h-auto py-2 text-ink";

/** A quiet inline text action, like a row's Edit or Delete (`<Button variant="link" size="xs" className={TEXT_ACTION}>`). */
export const TEXT_ACTION = "h-auto px-0 py-0 font-normal text-ink/60 hover:text-coral-deep hover:no-underline";

/** A file field whose "Choose file" button is a small ink pill. */
export const FILE_INPUT =
  "file:mr-3 file:h-auto file:rounded-full file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-paper";
