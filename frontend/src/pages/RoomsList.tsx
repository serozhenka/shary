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
      setError("Не вдалося завантажити кімнати. Спробуйте ще раз.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError("Назва кімнати не може бути порожньою");
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
      setError("Не вдалося створити кімнату. Спробуйте ще раз.");
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
      setError("Назва кімнати не може бути порожньою");
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
      setError("Не вдалося оновити кімнату. Спробуйте ще раз.");
      console.error(err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю кімнату?")) {
      return;
    }

    try {
      const success = await RoomService.deleteRoom(roomId);
      if (success) {
        setRooms(rooms.filter((room) => room.id !== roomId));
        setError(null);
      }
    } catch (err) {
      setError("Не вдалося видалити кімнату. Спробуйте ще раз.");
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
      setError("Електронна пошта не може бути порожньою");
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
          "Не вдалося додати користувача до кімнати. Перевірте електронну пошту та спробуйте ще раз."
        );
      }
    } catch (err) {
      setError("Не вдалося додати користувача до кімнати. Спробуйте ще раз.");
      console.error(err);
    }
  };

  return (
    <div className="rooms-container">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="room-title">Ваші кімнати</h1>
          <Link to="/" className="btn btn-outline-secondary">
            Назад на головну
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card create-room-card mb-4">
          <div className="card-body">
            <h5 className="card-title">Створити нову кімнату</h5>
            <form onSubmit={handleCreateRoom} className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Введіть назву кімнати"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                Створити кімнату
              </button>
            </form>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Завантаження...</span>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="alert alert-info">
            У вас ще немає кімнат. Створіть одну, щоб почати!
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
                            Зберегти
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={cancelEditing}
                          >
                            Скасувати
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
                                Власник
                              </span>
                            )}
                          </div>
                          <p className="card-text text-muted small">
                            Створено{" "}
                            {new Date(room.created_at).toLocaleString()}
                            {room.participants !== undefined && (
                              <span className="ms-2">
                                <i className="bi bi-people-fill"></i>{" "}
                                {room.participants}{" "}
                                {room.participants === 1
                                  ? "учасник"
                                  : "учасників"}
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
                            Приєднатися
                          </Link>
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-info me-2"
                              onClick={() => startAddingUser(room.id)}
                              title="Додати користувача до кімнати"
                            >
                              <i className="bi bi-person-plus"></i>
                            </button>
                          )}
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-light me-2"
                              onClick={() => startEditingRoom(room)}
                              title="Редагувати кімнату"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {room.is_owner && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteRoom(room.id)}
                              title="Видалити кімнату"
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
                      <h6 className="mb-2">Додати користувача до кімнати</h6>
                      <form onSubmit={handleAddUserToRoom} className="d-flex">
                        <input
                          type="email"
                          className="form-control me-2"
                          placeholder="Введіть електронну пошту користувача"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                          autoFocus
                        />
                        <button type="submit" className="btn btn-success me-2">
                          Додати
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={cancelAddingUser}
                        >
                          Скасувати
                        </button>
                      </form>
                      <small className="text-muted">
                        Введіть адресу електронної пошти користувача, якого ви
                        хочете додати до цієї кімнати.
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
