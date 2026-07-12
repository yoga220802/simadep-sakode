export type UserActionResult = {
  ok: boolean;
  message: string;
};

export const userActionInitialState: UserActionResult = {
  ok: false,
  message: "",
};
