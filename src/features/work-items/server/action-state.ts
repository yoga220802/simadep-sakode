export type WorkItemActionResult = {
  ok: boolean;
  message: string;
};

export const workItemActionInitialState: WorkItemActionResult = {
  ok: false,
  message: "",
};
