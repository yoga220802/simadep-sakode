export type ProjectActionResult = {
  ok: boolean;
  message: string;
  projectId?: string;
};

export const projectActionInitialState: ProjectActionResult = {
  ok: false,
  message: "",
};
