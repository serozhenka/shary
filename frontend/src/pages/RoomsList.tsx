import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RoomModel } from "../models/RoomModel";
import { RoomService } from "../services/RoomService";
import "../styles/RoomsList.css";

const RoomsList = () => {
  const [rooms, setRooms] = useState<RoomModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addingUserToRoomId, setAddingUserToRoomId] = useState<string | null>(
    null
  );
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const roomsData = await RoomService.getRooms();
      setRooms(roomsData);
      setError(null);
    } catch (err) {
      setError("Failed to load rooms. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError("Room name cannot be empty");
      return;
    }

    try {
      const newRoom = await RoomService.createRoom(newRoomName);
      if (newRoom) {
        setRooms([...rooms, newRoom]);
        setNewRoomName("");
        setError(null);
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    }
  };

  const startEditingRoom = (room: RoomModel) => {
    setEditingRoomId(room.id);
    setEditRoomName(room.name);
  };

  const cancelEditing = () => {
    setEditingRoomId(null);
    setEditRoomName("");
  };

  const handleUpdateRoom = async (roomId: string) => {
    if (!editRoomName.trim()) {
      setError("Room name cannot be empty");
      return;
    }

    try {
      const success = await RoomService.updateRoom(roomId, editRoomName);
      if (success) {
        setRooms(
          rooms.map((room) =>
            room.id === roomId ? { ...room, name: editRoomName } : room
          )
        );
        cancelEditing();
        setError(null);
      }
    } catch (err) {
      setError("Failed to update room. Please try again.");
      console.error(err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      const success = await RoomService.deleteRoom(roomId);
      if (success) {
        setRooms(rooms.filter((room) => room.id !== roomId));
        setError(null);
      }
    } catch (err) {
      setError("Failed to delete room. Please try again.");
      console.error(err);
    }
  };

  const startAddingUser = (roomId: string) => {
    setAddingUserToRoomId(roomId);
    setUserEmail("");
  };

  const cancelAddingUser = () => {
    setAddingUserToRoomId(null);
    setUserEmail("");
  };

  const handleAddUserToRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !addingUserToRoomId) {
      setError("Email cannot be empty");
      return;
    }

    try {
      const success = await RoomService.addUserToRoom(
        addingUserToRoomId,
        userEmail
      );
      if (success) {
        setError(null);
        cancelAddingUser();
        // Optionally reload rooms to get updated participant count
        loadRooms();
      } else {
        setError(
          "Failed to add user to room. Please check the email and try again."
        );
      }
    } catch (err) {
      setError("Failed to add user to room. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="rooms-container">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="room-title">Your Rooms</h1>
          <Link to="/" className="btn btn-outline-secondary">
            Back to Home
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card create-room-card mb-4">
          <div className="card-body">
            <h5 className="card-title">Create New Room</h5>
            <form onSubmit={handleCreateRoom} className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Enter room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                Create Room
              </button>
            </form>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="alert alert-info">
            You don't have any rooms yet. Create one to get started!
          </div>
        ) : (
          <div className="room-list">
            {rooms.map((room) => (
              <div key={room.id} className="room-card card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="room-info">
                      {editingRoomId === room.id ? (
                        <div className="editing-controls d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control me-2"
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            autoFocus
                          />
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleUpdateRoom(room.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex align-items-center mb-1">
                            <h5 className="card-title mb-0 me-2">
                              {room.name}
                            </h5>
                            {room.is_owner && (
                              <span className="badge bg-warning text-dark">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="card-text text-muted small">
                            Created {new Date(room.created_at).toLocaleString()}
                            {room.participants !== undefined && (
                              <span className="ms-2">
                                <i className="bi bi-people-fill"></i>{" "}
                                {room.participants}{" "}
                                {room.participants === 1
                                  ? "participant"
                                  : "participants"}
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="room-actions">
                      {editingRoomId !== room.id && (
                        <>
                          <Link
                            to={`/rooms/${room.id}`}
                            className="btn btn-primary me-2"
                          >
                            Join
                          </Link>
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-info me-2"
                              onClick={() => startAddingUser(room.id)}
                              title="Add user to room"
                            >
                              <i className="bi bi-person-plus"></i>
                            </button>
                          )}
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-light me-2"
                              onClick={() => startEditingRoom(room)}
                              title="Edit room"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteRoom(room.id)}
                              title="Delete room"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Add User Form */}
                  {addingUserToRoomId === room.id && (
                    <div className="mt-3 pt-3 border-top">
                      <h6 className="mb-2">Add User to Room</h6>
                      <form onSubmit={handleAddUserToRoom} className="d-flex">
                        <input
                          type="email"
                          className="form-control me-2"
                          placeholder="Enter user email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                          autoFocus
                        />
                        <button type="submit" className="btn btn-success me-2">
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={cancelAddingUser}
                        >
                          Cancel
                        </button>
                      </form>
                      <small className="text-muted">
                        Enter the email address of the user you want to add to
                        this room.
                      </small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsList;
