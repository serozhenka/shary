import axios from "axios";
import { RoomModel } from "../models/RoomModel";

const API_URL = `http://${window.location.hostname}:8000`;

export const RoomService = {
  async getRooms(): Promise<RoomModel[]> {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  },

  async createRoom(name: string): Promise<RoomModel | null> {
    try {
      const response = await axios.post(`${API_URL}/rooms`, { name });
      return response.data.data;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  },

  async updateRoom(id: string, name: string): Promise<boolean> {
    try {
      await axios.put(`${API_URL}/rooms/${id}`, { name });
      return true;
    } catch (error) {
      console.error("Error updating room:", error);
      return false;
    }
  },

  async deleteRoom(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/rooms/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  },

  async getRoomById(id: string): Promise<RoomModel | null> {
    try {
      const response = await axios.get(`${API_URL}/rooms/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching room:", error);
      return null;
    }
  },
};
