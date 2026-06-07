export type ActionStatus = "idle" | "success" | "error";

export interface ActionResult<TData = undefined> {
  status: ActionStatus;
  message?: string;
  data?: TData;
  fieldErrors?: Record<string, string[]>;
}

export const idleResult = (): ActionResult => ({ status: "idle" });
export const successResult = <T>(data?: T, message?: string): ActionResult<T> => ({
  status: "success",
  data,
  message,
});
export const errorResult = (
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult => ({ status: "error", message, fieldErrors });
