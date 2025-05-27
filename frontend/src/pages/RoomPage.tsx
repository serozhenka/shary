import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PeerComponent from "../components/Peer";
import Video from "../components/Video";
import { answerHandler } from "../messages/handlers/answer";
import { clientJoinedHandler } from "../messages/handlers/client_joined";
import { clientLeftHandler } from "../messages/handlers/client_left";
import { iceCandidateHandler } from "../messages/handlers/iceCandidate";
import { initHandler } from "../messages/handlers/init";
import { offerHandler } from "../messages/handlers/offer";
import { trackMutedHandler } from "../messages/handlers/trackMuted";
import { InboundMessage } from "../messages/inbound";
import { OutboundTrackMutedMessage } from "../messages/outbound";
import { RoomModel } from "../models/RoomModel";
import { Peer } from "../peer";
import { authService, User } from "../services/authService";
import { RoomService } from "../services/RoomService";

function RoomPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const peersRef = useRef(peers);
  const [isVideoEnabled, setVideoEnabled] = useState(true);
  const [isAudioEnabled, setAudioEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [roomData, setRoomData] = useState<RoomModel | null>(null);
  const localStreamRef = useRef(new MediaStream());
  const wsRef = useRef<WebSocket | null>(null);
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Fetch current user info
    const fetchCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Check if room exists and fetch room data
    const checkRoomExists = async () => {
      if (!roomId) {
        navigate("/rooms");
        return;
      }

      try {
        console.log("Checking if room exists:", roomId);
        const room = await RoomService.getRoomById(roomId);
        console.log("Room check result:", room);

        if (room) {
          console.log("Room exists, setting roomExists to true");
          setRoomExists(true);
          setRoomData(room);
        } else {
          console.log("Room not found (404), setting roomExists to false");
          setRoomExists(false);
          setRoomData(null);
          // Redirect to rooms page after a short delay to show error
          setTimeout(() => navigate("/rooms"), 2000);
        }
      } catch (error) {
        console.error("Error checking room (non-404):", error);
        // For non-404 errors, assume room exists and let WebSocket handle it
        // This prevents auth errors from blocking room access
        setRoomExists(true);
        setRoomData(null);
      }
    };

    checkRoomExists();
  }, [roomId, navigate]);

  const handlePeersChange = (func: (prev: Peer[]) => Peer[]): void => {
    setPeers((prevPeers) => {
      const newPeers = func(prevPeers);
      peersRef.current = newPeers;
      return newPeers;
    });
  };

  const handleToogleVideo = () => {
    setVideoEnabled((prevIsEnabled) => {
      const isEnabled = !prevIsEnabled;
      if (!isEnabled) {
        const [videoTrack] = localStreamRef.current.getVideoTracks();
        if (!videoTrack) return isEnabled;

        console.log("Stopping video track:", videoTrack);
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);

        peersRef.current.forEach((peer) => {
          peer.pc.getSenders().forEach((sender) => {
            if (!sender.track || sender.track!.kind !== "video") return;
            peer.remoteStream.removeTrack(sender.track!);
            sender.track!.stop();
            peer.pc.removeTrack(sender);
          });
        });

        const mutedMessage: OutboundTrackMutedMessage = {
          type: "trackMuted",
          payload: { trackKind: "video" },
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(mutedMessage));
        }
      } else {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              frameRate: 30,
              facingMode: { ideal: "user" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            const videoTracks = stream.getVideoTracks();
            console.log("Got new video tracks:", videoTracks);

            if (videoTracks.length > 0) {
              // Add all video tracks to local stream
              videoTracks.forEach((track) => {
                console.log("Adding video track to local stream:", track.id);
                localStreamRef.current.addTrack(track);
              });

              console.log(
                "Updated local stream tracks:",
                localStreamRef.current.getTracks()
              );

              // Add tracks to all peers
              peersRef.current.forEach((peer) => {
                videoTracks.forEach((track) => {
                  console.log("Adding video track to peer:", peer.id);
                  peer.pc.addTrack(track, localStreamRef.current);
                });
              });

              // Force a re-render by updating a state that doesn't affect the logic
              // This ensures the Video component re-evaluates the stream
              setVideoEnabled(true);
            }
          })
          .catch((err) => {
            console.error("Error getting video stream:", err);
            return prevIsEnabled; // Keep previous state on error
          });
      }

      return isEnabled;
    });
  };

  const handleToggleAudio = () => {
    setAudioEnabled((prevIsEnabled) => {
      const isEnabled = !prevIsEnabled;
      if (!isEnabled) {
        const [audioTrack] = localStreamRef.current.getAudioTracks();
        if (!audioTrack) return isEnabled;
        audioTrack.stop();
        localStreamRef.current.removeTrack(audioTrack);

        peersRef.current.forEach((peer) => {
          peer.pc.getSenders().forEach((sender) => {
            if (!sender.track || sender.track!.kind !== "audio") return;
            peer.remoteStream.removeTrack(sender.track!);
            sender.track!.stop();
            peer.pc.removeTrack(sender);
          });
        });

        const mutedMessage: OutboundTrackMutedMessage = {
          type: "trackMuted",
          payload: { trackKind: "audio" },
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(mutedMessage));
        }
      } else {
        navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          .then((stream) => {
            const audioTracks = stream.getAudioTracks();
            console.log("Got new audio tracks:", audioTracks);

            audioTracks.forEach((track) => {
              localStreamRef.current.addTrack(track);
            });

            peersRef.current.forEach((peer) => {
              audioTracks.forEach((track) => {
                console.log("Adding audio track to peer:", peer.id);
                peer.pc.addTrack(track, localStreamRef.current);
              });
            });
          })
          .catch((err) => {
            console.error("Error getting audio stream:", err);
            return prevIsEnabled; // Keep previous state on error
          });
      }

      return isEnabled;
    });
  };

  const handleEndCall = () => {
    console.log("Ending call and cleaning up resources");

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop all local media tracks
    const localStream = localStreamRef.current;
    localStream.getTracks().forEach((track) => {
      track.stop();
      localStream.removeTrack(track);
    });

    // Close all peer connections
    peersRef.current.forEach((peer) => {
      if (peer.pc) {
        peer.pc.close();
      }
    });

    // Clear peers state
    setPeers([]);
    peersRef.current = [];

    // Navigate back to rooms page
    navigate("/rooms");
  };

  useEffect(() => {
    // Only set up WebSocket if room exists
    if (roomExists !== true) return;

    let ws: WebSocket;
    let isMounted = true;

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          frameRate: 30,
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isMounted) return;
      stream.getTracks().forEach((track) => {
        localStreamRef.current.addTrack(track);
      });

      console.log("Local stream tracks:", localStreamRef.current.getTracks());

      // Use the same hostname that the user used to access the site
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = authService.getToken();
      const wsUrl = `${wsProtocol}//localhost:8000/ws?token=${encodeURIComponent(
        token || ""
      )}&roomId=${encodeURIComponent(roomId || "")}`;
      console.log("Connecting to WebSocket at:", wsUrl);

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log("WebSocket connection was opened");

      ws.onmessage = async (event) => {
        let message: InboundMessage = JSON.parse(event.data);

        if (message.type === "init") {
          initHandler({
            message,
            ws,
            rtcConfig,
            handlePeersChange,
            localStream: localStreamRef.current,
          });
        } else if (message.type === "client_joined") {
          await clientJoinedHandler({
            message,
            rtcConfig,
            ws,
            handlePeersChange,
            localStream: localStreamRef.current,
          });
        } else if (message.type === "client_left") {
          clientLeftHandler({ message, handlePeersChange });
        } else if (message.type === "offer") {
          await offerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "answer") {
          await answerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "iceCandidate") {
          iceCandidateHandler({ message, peers: peersRef.current });
        } else if (message.type === "trackMuted") {
          trackMutedHandler({
            peers: peersRef.current,
            message,
            handlePeersChange,
          });
        }
      };
    })();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      peers.forEach((client) => client.pc?.close());

      const localStream = localStreamRef.current;
      localStream.getAudioTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
      setPeers([]);
    };
  }, [roomExists, roomId]);

  // Show loading while checking room existence
  if (roomExists === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        Завантаження кімнати...
      </div>
    );
  }

  // Show error message if room doesn't exist
  if (roomExists === false) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          backgroundColor: "#1a1a1a",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2>Кімнату не знайдено</h2>
        <p>Кімната, до якої ви намагаєтеся приєднатися, не існує.</p>
        <p>Перенаправлення на сторінку кімнат...</p>
      </div>
    );
  }

  // Calculate grid layout classes based on number of participants
  const totalParticipants = peers.length + 1; // Including local user
  let gridClass = "grid-1";

  if (totalParticipants <= 1) {
    gridClass = "grid-1";
  } else if (totalParticipants <= 2) {
    gridClass = "grid-2";
  } else if (totalParticipants <= 4) {
    gridClass = "grid-4";
  } else if (totalParticipants <= 9) {
    gridClass = "grid-9";
  } else {
    gridClass = "grid-16";
  }

  return (
    <div className="room-container d-flex flex-column vh-100 bg-dark">
      <div className="room-header d-flex justify-content-between align-items-center p-3">
        <h4 className="text-white m-0">
          {roomData?.name || roomId || "Кімната зустрічі"}
        </h4>
      </div>

      <div className="video-content flex-grow-1 overflow-auto p-3">
        <div className={`video-grid ${gridClass}`}>
          <div className="video-container position-relative">
            <div className="position-absolute z-1 bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom-3 ps-3 pe-3">
              {currentUser?.username || "Ви"}
              <i
                className={`ms-2 bi ${
                  isAudioEnabled ? "" : "bi-mic-mute-fill text-danger"
                }`}
              ></i>
            </div>
            <Video
              stream={localStreamRef.current}
              mirrored={true}
              muted={true}
              username={currentUser?.username || "Ви"}
              showPlaceholder={!isVideoEnabled}
            />
          </div>

          {peers.map((peer) => (
            <PeerComponent
              key={peer.id}
              peer={peer}
              isVideoEnabled={isVideoEnabled}
            />
          ))}
        </div>
      </div>

      <div className="room-footer bg-dark border-top border-secondary p-3">
        <div className="d-flex justify-content-center gap-4">
          <button
            onClick={handleToogleVideo}
            className={`btn ${
              isVideoEnabled ? "btn-outline-light" : "btn-danger"
            } rounded-circle`}
          >
            <i
              className={`bi ${
                isVideoEnabled ? "bi-camera-video" : "bi-camera-video-off"
              }`}
            ></i>
          </button>

          <button
            onClick={handleToggleAudio}
            className={`btn ${
              isAudioEnabled ? "btn-outline-light" : "btn-danger"
            } rounded-circle`}
          >
            <i
              className={`bi ${isAudioEnabled ? "bi-mic" : "bi-mic-mute"}`}
            ></i>
          </button>

          <button
            onClick={handleEndCall}
            className="btn btn-outline-danger rounded-circle"
          >
            <i className="bi bi-telephone-x"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
