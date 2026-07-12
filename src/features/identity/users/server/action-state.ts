export type UserActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

export const userActionInitialState: UserActionResult = {
  ok: false,
  message: "",
};
