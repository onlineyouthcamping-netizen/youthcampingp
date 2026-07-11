import { api } from "./api";
import { User } from "@/types";

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data.data;
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data.data;
  }
};
