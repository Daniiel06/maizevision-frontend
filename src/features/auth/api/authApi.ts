import { apiClient } from "../../../shared/api/apiClient";
import type {
  LoginRequest,
  LoginResponse,
} from "../types/auth.types";

export const login = async (
  request: LoginRequest
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    request
  );

  return response.data;
};