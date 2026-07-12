export type WorkItemActionResult = {
  ok: boolean;
  message: string;
  taskId?: string;
  taskVersion?: number;
};

export const workItemActionInitialState: WorkItemActionResult = {
  ok: false,
  message: "",
};
