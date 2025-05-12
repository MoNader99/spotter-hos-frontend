import { store } from "../redux/store";

export const getAuthToken = () => {
  const state = store.getState();
  return state.auth.token;
};
