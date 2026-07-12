export type ProjectActionResult = {
  ok: boolean;
  message: string;
  projectId?: string;
  projectVersion?: number;
};

export const projectActionInitialState: ProjectActionResult = {
  ok: false,
  message: "",
};
