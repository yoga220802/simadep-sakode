export type CollaborationActionResult = {
  ok: boolean;
  message: string;
};

export const collaborationActionInitialState: CollaborationActionResult = {
  ok: false,
  message: "",
};
