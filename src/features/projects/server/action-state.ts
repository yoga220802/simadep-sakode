export type ProjectActionResult = {
  ok: boolean;
  message: string;
};

export const projectActionInitialState: ProjectActionResult = {
  ok: false,
  message: "",
};
