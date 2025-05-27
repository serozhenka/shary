import axios from "axios";
import { RoomModel } from "../models/RoomModel";
import { authService } from "./authService";

const API_URL = `http://localhost:8000`;

export const RoomService = {
  async getRooms(): Promise<RoomModel[]> {
    try {
      const response = await axios.get(`${API_URL}/rooms`, {
        headers: authService.getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  },

  async createRoom(name: string): Promise<RoomModel | null> {
    try {
      const response = await axios.post(
        `${API_URL}/rooms`,
        { name },
        {
          headers: authService.getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  },

  async updateRoom(id: string, name: string): Promise<boolean> {
    try {
      await axios.put(
        `${API_URL}/rooms/${id}`,
        { name },
        {
          headers: authService.getAuthHeaders(),
        }
      );
      return true;
    } catch (error) {
      console.error("Error updating room:", error);
      return false;
    }
  },

  async deleteRoom(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/rooms/${id}`, {
        headers: authService.getAuthHeaders(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  },

  async getRoomById(id: string): Promise<RoomModel | null> {
    try {
      const response = await axios.get(`${API_URL}/rooms/${id}`, {
        headers: authService.getAuthHeaders(),
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Room not found
        return null;
      }
      // For other errors, throw so the caller can handle them
      console.error("Error fetching room:", error);
      throw error;
    }
  },
};
